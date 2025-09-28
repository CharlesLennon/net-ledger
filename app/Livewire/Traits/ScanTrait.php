<?php

namespace App\Livewire\Traits;

use Illuminate\Support\Facades\Log;

trait ScanTrait
{
    public string $subnet = '';

    public string $scanType = 'auto';

    public int $timeout = 10;

    public bool $scanning = false;

    public array $scanResults = [];

    public array $selectedHosts = [];

    public bool $showCommitOptions = false;

    public array $scannedIPsNoResponse = [];

    public bool $showUnresponsiveIPs = true;

    public array $scanMethods = ['arp', 'ping'];

    public array $availableMethods = [
        'ping' => 'ICMP Ping',
        'arp' => 'ARP Table',
        'snmp' => 'SNMP (Coming Soon)',
        'lldp' => 'LLDP (Coming Soon)',
    ];

    public array $localIPs = [];

    public string $detectedSubnet = '';

    public array $scanHistory = [];

    public string $progressText = '';

    public array $currentProgress = [];

    public string $scanId = '';

    public bool $scanInProgress = false;

    public array $ipQueue = [];

    public int $currentIPIndex = 0;

    public int $totalIPs = 0;

    public int $scannedIPs = 0;

    public int $foundHosts = 0;

    public string $currentPhase = '';

    public string $currentIP = '';

    public string $currentScanner = '';

    public function loadLocalNetworkInfo(): void
    {
        try {
            $this->localIPs = $this->getLocalIPs();
            $this->detectedSubnet = $this->detectLocalSubnet() ?? '192.168.1.0/24';

            if (empty($this->subnet)) {
                $this->subnet = $this->detectedSubnet;
            }
        } catch (\Exception $e) {
            Log::error('Failed to load local network info: '.$e->getMessage());
            $this->subnet = '192.168.1.0/24';
        }
    }

    private function getLocalIPs(): array
    {
        $localIPs = [];

        try {
            if (PHP_OS_FAMILY === 'Windows') {
                $result = shell_exec('ipconfig');
                if ($result && preg_match_all('/IPv4 Address[.\s]*: ([\d.]+)/', $result, $matches)) {
                    $localIPs = $matches[1] ?? [];
                }
            } else {
                $result = shell_exec('hostname -I');
                if ($result) {
                    $localIPs = array_filter(explode(' ', trim($result)));
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to get local IPs: '.$e->getMessage());
        }

        return array_filter($localIPs, function ($ip) {
            return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && ! str_starts_with($ip, '127.');
        });
    }

    private function detectLocalSubnet(): ?string
    {
        $localIPs = $this->getLocalIPs();

        foreach ($localIPs as $ip) {
            if (str_starts_with($ip, '192.168.') || str_starts_with($ip, '10.') || preg_match('/^172\.(1[6-9]|2[0-9]|3[01])\./', $ip)) {
                $parts = explode('.', $ip);
                $parts[3] = '0';

                return implode('.', $parts).'/24';
            }
        }

        return null;
    }

    public function loadScanHistory(): void
    {
        try {
            $logFile = storage_path('logs/network-scan.log');
            if (file_exists($logFile)) {
                $this->scanHistory = array_slice(file($logFile), -10);
            }
        } catch (\Exception $e) {
            Log::error('Failed to load scan history: '.$e->getMessage());
        }
    }

    public function startScan(): void
    {
        $this->validate([
            'subnet' => 'required|string',
            'timeout' => 'required|integer|min=1|max=30',
        ]);

        $this->resetProgress();
        $this->scanning = true;
        $this->scanResults = [];
        $this->selectedHosts = [];
        $this->showCommitOptions = false;

        try {
            Log::info('NetworkScanManager: Starting scan', [
                'subnet' => $this->subnet,
                'scan_methods' => $this->scanMethods,
                'timeout' => $this->timeout,
            ]);

            $this->scannerManager->setProgressCallback(function ($scanner, $phase, $currentTarget = '', $data = []) {
                $this->updateProgress($scanner, $phase, $currentTarget, $data);
            });

            $this->scannerManager->setTimeout($this->timeout);

            if ($scanner = $this->scannerManager->getScanner('ping')) {
                $reflectionMethod = new \ReflectionMethod($scanner, 'parseSubnet');
                $reflectionMethod->setAccessible(true);
                $ipRange = $reflectionMethod->invoke($scanner, $this->subnet);
                $this->totalIPs = min(count($ipRange), 50);
            }

            Log::info('NetworkScanManager: About to call scanSubnet', [
                'subnet' => $this->subnet,
                'timeout' => $this->timeout,
                'scan_methods' => $this->scanMethods,
                'total_ips' => $this->totalIPs,
            ]);

            $scanResult = $this->scannerManager->scanSubnet($this->subnet, $this->scanMethods);
            $discoveredHosts = $scanResult->toArray();

            Log::info('NetworkScanManager: Scan completed', [
                'hosts_found' => count($discoveredHosts),
                'scan_duration' => $scanResult->getScanDuration(),
                'methods_used' => $scanResult->getScanMethods(),
            ]);

            if (empty($discoveredHosts)) {
                Log::info('NetworkScanManager: No hosts discovered');
                $this->dispatch('scan-completed', 'No hosts discovered on the network');
            } else {
                Log::info('NetworkScanManager: Processing discovered hosts', [
                    'host_count' => count($discoveredHosts),
                ]);

                $this->scanResults = $discoveredHosts;
                $this->showCommitOptions = true;

                $responsiveIndexes = [];
                foreach ($discoveredHosts as $index => $host) {
                    if (isset($host['responsive']) && $host['responsive']) {
                        $responsiveIndexes[] = $index;
                    }
                }
                $this->selectedHosts = $responsiveIndexes;

                $hostCount = count($responsiveIndexes);
                $this->dispatch('scan-completed', "Found {$hostCount} responsive hosts! Review below and choose which to add to inventory.");
            }

        } catch (\Exception $e) {
            Log::error('Network scan failed: '.$e->getMessage(), [
                'exception' => $e,
                'subnet' => $this->subnet,
                'scan_methods' => $this->scanMethods,
                'timeout' => $this->timeout,
            ]);
            $this->dispatch('scan-failed', 'Network scan failed: '.$e->getMessage());
        } finally {
            $this->scanning = false;
            $this->currentPhase = 'Completed';
        }
    }

    private function resetProgress(): void
    {
        $this->totalIPs = 0;
        $this->scannedIPs = 0;
        $this->foundHosts = 0;
        $this->currentPhase = 'Initializing';
        $this->currentIP = '';
        $this->currentScanner = '';
        $this->progressText = '';
        $this->currentProgress = [];
        $this->ipQueue = [];
        $this->currentIPIndex = 0;
        $this->scannedIPsNoResponse = [];
    }

    public function updateProgress(string $scanner, string $phase, string $currentTarget = '', array $data = []): void
    {
        $this->currentScanner = $scanner;
        $this->currentPhase = $phase;
        $this->currentIP = $currentTarget;

        if (isset($data['scanned'])) {
            $this->scannedIPs = $data['scanned'];
        }

        if (isset($data['found_count'])) {
            $this->foundHosts = $data['found_count'];
        } elseif (isset($data['total_hosts'])) {
            $this->foundHosts = $data['total_hosts'];
        }

        $percentage = $this->totalIPs > 0 ? round(($this->scannedIPs / $this->totalIPs) * 100) : 0;
        $this->progressText = "Scanning {$this->scannedIPs}/{$this->totalIPs} IPs ({$percentage}%) - Found {$this->foundHosts} hosts";

        $this->currentProgress = [
            'scanner' => $scanner,
            'phase' => $phase,
            'target' => $currentTarget,
            'scanned' => $this->scannedIPs,
            'total' => $this->totalIPs,
            'found' => $this->foundHosts,
            'percentage' => $percentage,
        ];

        $this->dispatch('progress-updated', [
            'scanner' => $this->currentScanner,
            'phase' => $this->currentPhase,
            'current_target' => $this->currentIP,
            'scanned' => $this->scannedIPs,
            'total' => $this->totalIPs,
            'found' => $this->foundHosts,
        ]);
    }

    public function quickScan(): void
    {
        $this->timeout = 1;

        $originalSubnet = $this->subnet;
        if (str_contains($this->subnet, '/24')) {
            $parts = explode('/', $this->subnet);
            $baseIP = explode('.', $parts[0]);
            $baseIP[3] = '1';
            $this->subnet = implode('.', $baseIP).'/29';
        }

        $this->startScan();
        $this->subnet = $originalSubnet;
    }

    public function detailedScan(): void
    {
        $this->timeout = 10;
        $this->startScan();
    }

    public function testSingleHost(string $ip): void
    {
        try {
            $this->scanning = true;
            $this->resetProgress();

            $this->scannerManager->setTimeout($this->timeout);

            $hostInfo = $this->scannerManager->scanHost($ip, $this->scanMethods);
            if ($hostInfo) {
                $this->scanResults = [$hostInfo];
                $this->selectedHosts = [0];
                $this->showCommitOptions = true;

                $this->scannedIPsNoResponse = array_filter($this->scannedIPsNoResponse, function ($noResponseIp) use ($ip) {
                    return $noResponseIp !== $ip;
                });

                $this->dispatch('host-discovered', "Host {$ip} discovered successfully!");
                Log::info("Single host test successful for {$ip}");
            } else {
                $this->dispatch('host-not-found', "Host {$ip} is not reachable or has no services.");
                Log::info("Single host test failed for {$ip}");
            }
        } catch (\Exception $e) {
            $this->dispatch('scan-failed', 'Host scan failed: '.$e->getMessage());
            Log::error("Single host test error for {$ip}: ".$e->getMessage());
        } finally {
            $this->scanning = false;
            $this->scanInProgress = false;
        }
    }

    public function startChunkedScan(): void
    {
        $this->validate([
            'subnet' => 'required|string',
            'timeout' => 'required|integer|min=1|max=300',
            'scanType' => 'required|string|in:auto,arp,ping',
        ]);

        switch ($this->scanType) {
            case 'arp':
                $this->scanMethods = ['arp'];
                break;
            case 'ping':
                $this->scanMethods = ['ping'];
                break;
            case 'auto':
            default:
                $this->scanMethods = ['arp', 'ping'];
                break;
        }

        $this->resetProgress();
        $this->scanning = true;
        $this->scanInProgress = true;
        $this->scanResults = [];
        $this->selectedHosts = [];
        $this->showCommitOptions = false;
        $this->scannedIPsNoResponse = [];
        $this->scanId = uniqid('scan_');

        try {
            $this->generateIPQueue();

            $this->progressText = 'Scan initialized - Starting IP discovery...';
            $this->currentProgress = [
                'scanner' => 'System',
                'phase' => 'Starting',
                'target' => $this->subnet,
                'scanned' => 0,
                'total' => count($this->ipQueue),
                'found' => 0,
                'percentage' => 0,
            ];
            $this->totalIPs = count($this->ipQueue);

            Log::info('NetworkScanManager: Starting async scan', [
                'subnet' => $this->subnet,
                'scan_methods' => $this->scanMethods,
                'total_ips' => $this->totalIPs,
            ]);

            $this->dispatch('start-polling');

        } catch (\Exception $e) {
            Log::error('Failed to start async scan: '.$e->getMessage());
            $this->scanning = false;
            $this->scanInProgress = false;
            $this->dispatch('scan-failed', 'Failed to start scan: '.$e->getMessage());
        }
    }

    private function generateIPQueue(): void
    {
        try {
            if ($scanner = $this->scannerManager->getScanner('ping')) {
                $reflectionMethod = new \ReflectionMethod($scanner, 'parseSubnet');
                $reflectionMethod->setAccessible(true);
                $ipRange = $reflectionMethod->invoke($scanner, $this->subnet);
                $this->ipQueue = $ipRange;
            } else {
                if (str_contains($this->subnet, '/24')) {
                    $baseIP = explode('/', $this->subnet)[0];
                    $octets = explode('.', $baseIP);
                    $octets[3] = '1';

                    for ($i = 1; $i <= 254; $i++) {
                        $octets[3] = (string) $i;
                        $this->ipQueue[] = implode('.', $octets);
                    }
                } elseif (str_contains($this->subnet, '/')) {
                    $this->generateIPsFromCIDR($this->subnet);
                } else {
                    $this->ipQueue = [$this->subnet];
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to generate IP queue: '.$e->getMessage());
            $this->ipQueue = ['192.168.1.1', '192.168.1.2'];
        }
    }

    private function generateIPsFromCIDR(string $cidr): void
    {
        try {
            [$baseIP, $prefixLength] = explode('/', $cidr);
            $prefixLength = (int) $prefixLength;

            $hostBits = 32 - $prefixLength;
            $numHosts = pow(2, $hostBits) - 2;

            if ($numHosts > 65534) {
                Log::warning('Subnet too large, limiting to first 1000 IPs', ['cidr' => $cidr]);
                $numHosts = 1000;
            }

            $baseIPLong = ip2long($baseIP);
            $networkAddress = $baseIPLong & ((-1 << $hostBits));

            for ($i = 1; $i <= $numHosts; $i++) {
                $hostIP = long2ip($networkAddress + $i);
                if ($hostIP) {
                    $this->ipQueue[] = $hostIP;
                }
            }

            Log::info('Generated IP queue from CIDR', [
                'cidr' => $cidr,
                'total_ips' => count($this->ipQueue),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to parse CIDR: '.$e->getMessage());
            $this->ipQueue = [explode('/', $cidr)[0]];
        }
    }

    public function processScanChunk(): void
    {
        if (! $this->scanInProgress || $this->currentIPIndex >= count($this->ipQueue)) {
            $this->completeScan();
            return;
        }

        try {
            $currentIP = $this->ipQueue[$this->currentIPIndex];
            $this->currentIP = $currentIP;
            Log::info('Scanning single IP', [
                'ip' => $currentIP,
                'index' => $this->currentIPIndex,
                'total' => count($this->ipQueue),
            ]);

            $this->scannedIPs = $this->currentIPIndex + 1;
            $percentage = round(($this->scannedIPs / $this->totalIPs) * 100);

            $this->progressText = "Scanning {$this->scannedIPs}/{$this->totalIPs} IPs ({$percentage}%) - Found {$this->foundHosts} hosts";
            $this->currentProgress = [
                'scanner' => 'Network Scanner',
                'phase' => 'Scanning IP',
                'target' => $currentIP,
                'scanned' => $this->scannedIPs,
                'total' => $this->totalIPs,
                'found' => $this->foundHosts,
                'percentage' => $percentage,
            ];

            $hostInfo = $this->scannerManager->scanHostQuick($currentIP, $this->scanMethods);
            if ($hostInfo) {
                $hostInfo['responsive'] = true;
                $hostInfo['scan_order'] = $this->currentIPIndex;
                $this->scanResults[] = $hostInfo;
                $this->foundHosts++;

                Log::info('Host discovered', [
                    'ip' => $currentIP,
                    'hostname' => $hostInfo['hostname'] ?? 'Unknown',
                ]);
            } else {
                $noResponseHost = [
                    'ip' => $currentIP,
                    'hostname' => 'No Response',
                    'mac' => 'N/A',
                    'responsive' => false,
                    'scan_order' => $this->currentIPIndex,
                    'services' => [],
                ];
                $this->scanResults[] = $noResponseHost;
                $this->scannedIPsNoResponse[] = $currentIP;

                Log::debug('No response from IP', [
                    'ip' => $currentIP,
                    'methods' => $this->scanMethods,
                ]);
            }

            $this->currentIPIndex++;

        } catch (\Exception $e) {
            Log::error('Error scanning IP: '.$e->getMessage(), [
                'ip' => $this->currentIP,
                'index' => $this->currentIPIndex,
            ]);

            $this->scannedIPsNoResponse[] = $this->currentIP;
            $this->currentIPIndex++;
        }
    }

    private function completeScan(): void
    {
        $this->scanInProgress = false;
        $this->scanning = false;

        Log::info('NetworkScanManager: Scan completed', [
            'hosts_found' => count($this->scanResults),
            'total_ips_scanned' => $this->scannedIPs,
            'ips_no_response' => count($this->scannedIPsNoResponse),
        ]);

        if (empty($this->scanResults)) {
            $noResponseCount = count($this->scannedIPsNoResponse);
            $this->progressText = "Scan completed - No hosts found ({$noResponseCount} IPs scanned)";
            $this->dispatch('scan-completed', "No hosts discovered on the network. {$noResponseCount} IPs were scanned but didn't respond.");
        } else {
            $this->showCommitOptions = true;
            $this->selectedHosts = array_keys($this->scanResults);

            $hostCount = count($this->scanResults);
            $noResponseCount = count($this->scannedIPsNoResponse);
            $this->progressText = "Scan completed - Found {$hostCount} hosts ({$noResponseCount} IPs no response)";
            $this->dispatch('scan-completed', "Found {$hostCount} hosts! Review below and choose which to add to inventory.");
        }
    }

    public function getScanStatus(): array
    {
        return [
            'scanning' => $this->scanning,
            'scanInProgress' => $this->scanInProgress,
            'progressText' => $this->progressText,
            'currentProgress' => $this->currentProgress,
            'scanResults' => $this->scanResults,
            'showCommitOptions' => $this->showCommitOptions,
            'scannedIPsNoResponse' => $this->scannedIPsNoResponse,
        ];
    }

    public function toggleScanMethod(string $method): void
    {
        $availableScanners = $this->scannerManager->getAvailableScanners();

        if (! in_array($method, $availableScanners)) {
            Log::warning("Attempted to toggle unavailable scanner: {$method}");
            return;
        }

        if (in_array($method, $this->scanMethods)) {
            $this->scanMethods = array_filter($this->scanMethods, fn ($m) => $m !== $method);
        } else {
            $this->scanMethods[] = $method;
        }

        if (empty($this->scanMethods)) {
            $this->scanMethods = [$availableScanners[0] ?? 'ping'];
        }
    }
}

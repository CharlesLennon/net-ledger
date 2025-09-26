<?php

namespace App\Livewire;

use App\Services\NetworkScannerManager;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Livewire\Component;

class NetworkScanManager extends Component
{
    public string $subnet = '';

    public string $scanType = 'auto';

    public int $timeout = 10; // Reasonable default timeout

    public bool $scanning = false;

    public bool $dryRun = true;

    public array $scanResults = [];

    public array $selectedHosts = [];

    public bool $showCommitOptions = false;

    // Track scanned IPs with no response
    public array $scannedIPsNoResponse = [];

    // Toggle to show/hide unresponsive IPs in the main results list
    public bool $showUnresponsiveIPs = true;

    // Port scanning properties
    public bool $portScanEnabled = false;

    public string $commonPorts = '22,23,25,53,80,110,143,443,993,995,8080,8443,3389,5432,3306,1433,27017';

    public array $customPorts = [];

    public bool $scanAllHosts = false;

    public array $selectedHostsForPortScan = [];

    public bool $portScanning = false;

    public array $portScanResults = [];

    public string $customPortInput = '';

    // Port scanning state management for chunked processing
    public string $portScanId = '';

    public bool $portScanInProgress = false;

    public array $portQueue = [];

    public array $hostQueue = [];

    public int $currentPortIndex = 0;

    public int $currentHostIndex = 0;

    public int $totalPorts = 0;

    public int $scannedPorts = 0;

    public int $totalPortScans = 0; // total host*port combinations

    public int $completedPortScans = 0;

    public string $currentPortScanHost = '';

    public string $currentPortScanPort = '';

    public array $portScanProgress = [];

    // Progress tracking
    public int $totalIPs = 0;

    public int $scannedIPs = 0;

    public int $foundHosts = 0;

    public string $currentPhase = '';

    public string $currentIP = '';

    public string $currentScanner = '';

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

    // Progress display properties for UI
    public string $progressText = '';

    public array $currentProgress = [];

    // Scan state management
    public string $scanId = '';

    public bool $scanInProgress = false;

    public array $ipQueue = [];

    public int $currentIPIndex = 0;

    protected NetworkScannerManager $scannerManager;

    public function boot(NetworkScannerManager $scannerManager): void
    {
        $this->scannerManager = $scannerManager;
    }

    public function mount(): void
    {
        $this->loadLocalNetworkInfo();
        $this->loadScanHistory();

        // Update available methods based on what scanners are actually available
        $availableScanners = $this->scannerManager->getAvailableScanners();
        Log::info('Available scanners on mount:', $availableScanners);

        // Filter scan methods to only include available ones
        $this->scanMethods = array_intersect($this->scanMethods, $availableScanners);
        if (empty($this->scanMethods)) {
            $this->scanMethods = $availableScanners; // Use all available if none selected
        }
    }

    public function loadLocalNetworkInfo(): void
    {
        try {
            // For now, use a simple method to detect local network
            // We can enhance this later with proper local IP detection
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

    /**
     * Get local IP addresses
     */
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

        // Filter out loopback and invalid IPs
        return array_filter($localIPs, function ($ip) {
            return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && ! str_starts_with($ip, '127.');
        });
    }

    /**
     * Detect local subnet
     */
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
                $this->scanHistory = array_slice(file($logFile), -10); // Last 10 lines
            }
        } catch (\Exception $e) {
            Log::error('Failed to load scan history: '.$e->getMessage());
        }
    }

    public function startScan(): void
    {
        $this->validate([
            'subnet' => 'required|string',
            'timeout' => 'required|integer|min:1|max:30',
        ]);

        // Reset progress tracking
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

            // Set up progress callback
            $this->scannerManager->setProgressCallback(function ($scanner, $phase, $currentTarget = '', $data = []) {
                $this->updateProgress($scanner, $phase, $currentTarget, $data);
            });

            // Configure scanner manager
            $this->scannerManager->setTimeout($this->timeout);

            // Get estimated total IPs for progress calculation
            if ($scanner = $this->scannerManager->getScanner('ping')) {
                $reflectionMethod = new \ReflectionMethod($scanner, 'parseSubnet');
                $reflectionMethod->setAccessible(true);
                $ipRange = $reflectionMethod->invoke($scanner, $this->subnet);
                $this->totalIPs = min(count($ipRange), 50); // Cap at 50 for UI
            }

            Log::info('NetworkScanManager: About to call scanSubnet', [
                'subnet' => $this->subnet,
                'timeout' => $this->timeout,
                'scan_methods' => $this->scanMethods,
                'total_ips' => $this->totalIPs,
            ]);

            // Perform the scan using the new scanner manager
            $scanResult = $this->scannerManager->scanSubnet($this->subnet, $this->scanMethods);

            // Convert ScanResult to array format expected by the UI
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

                // Pre-select only responsive hosts
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

    /**
     * Reset progress tracking
     */
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

    /**
     * Update progress and trigger UI refresh
     */
    public function updateProgress(string $scanner, string $phase, string $currentTarget = '', array $data = []): void
    {
        $this->currentScanner = $scanner;
        $this->currentPhase = $phase;
        $this->currentIP = $currentTarget;

        // Extract data from the callback
        if (isset($data['scanned'])) {
            $this->scannedIPs = $data['scanned'];
        }

        if (isset($data['found_count'])) {
            $this->foundHosts = $data['found_count'];
        } elseif (isset($data['total_hosts'])) {
            $this->foundHosts = $data['total_hosts'];
        }

        // Update progress text for UI
        $percentage = $this->totalIPs > 0 ? round(($this->scannedIPs / $this->totalIPs) * 100) : 0;
        $this->progressText = "Scanning {$this->scannedIPs}/{$this->totalIPs} IPs ({$percentage}%) - Found {$this->foundHosts} hosts";

        // Update current progress info
        $this->currentProgress = [
            'scanner' => $scanner,
            'phase' => $phase,
            'target' => $currentTarget,
            'scanned' => $this->scannedIPs,
            'total' => $this->totalIPs,
            'found' => $this->foundHosts,
            'percentage' => $percentage,
        ];

        // Force Livewire to update the UI
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
        $this->timeout = 1; // Very aggressive timeout for quick scans

        // For quick scans, only scan the first 10 IPs
        $originalSubnet = $this->subnet;
        if (str_contains($this->subnet, '/24')) {
            $parts = explode('/', $this->subnet);
            $baseIP = explode('.', $parts[0]);
            $baseIP[3] = '1'; // Start from .1
            $this->subnet = implode('.', $baseIP).'/29'; // /29 = 8 IPs
        }

        $this->startScan();

        // Restore original subnet
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

            // Configure scanner manager for single host
            $this->scannerManager->setTimeout($this->timeout);

            $hostInfo = $this->scannerManager->scanHost($ip, $this->scanMethods);
            if ($hostInfo) {
                $this->scanResults = [$hostInfo];
                $this->selectedHosts = [0];
                $this->showCommitOptions = true;

                // Remove from no-response list if it was there
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

    /**
     * Start scan with async processing to avoid timeouts
     */
    public function startChunkedScan(): void
    {
        $this->validate([
            'subnet' => 'required|string',
            'timeout' => 'required|integer|min:1|max:300', // Allow up to 5 minutes per IP
            'scanType' => 'required|string|in:auto,arp,ping',
        ]);

        // Set scan methods based on scan type
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

        // Reset progress tracking
        $this->resetProgress();
        $this->scanning = true;
        $this->scanInProgress = true;
        $this->scanResults = [];
        $this->selectedHosts = [];
        $this->showCommitOptions = false;
        $this->scannedIPsNoResponse = [];
        $this->scanId = uniqid('scan_');

        try {
            // Generate IP list from subnet
            $this->generateIPQueue();

            // Set initial progress
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

            // Start the scanning process
            $this->dispatch('start-polling');

        } catch (\Exception $e) {
            Log::error('Failed to start async scan: '.$e->getMessage());
            $this->scanning = false;
            $this->scanInProgress = false;
            $this->dispatch('scan-failed', 'Failed to start scan: '.$e->getMessage());
        }
    }

    /**
     * Generate IP queue from subnet
     */
    private function generateIPQueue(): void
    {
        try {
            // Create a temporary ping scanner to parse subnet
            if ($scanner = $this->scannerManager->getScanner('ping')) {
                $reflectionMethod = new \ReflectionMethod($scanner, 'parseSubnet');
                $reflectionMethod->setAccessible(true);
                $ipRange = $reflectionMethod->invoke($scanner, $this->subnet);

                // Use all IPs in the range - no artificial limits
                $this->ipQueue = $ipRange;
            } else {
                // Fallback: manual parsing for /24 networks
                if (str_contains($this->subnet, '/24')) {
                    $baseIP = explode('/', $this->subnet)[0];
                    $octets = explode('.', $baseIP);
                    $octets[3] = '1'; // Start from .1

                    // Scan all 254 possible host IPs in /24 subnet
                    for ($i = 1; $i <= 254; $i++) {
                        $octets[3] = (string) $i;
                        $this->ipQueue[] = implode('.', $octets);
                    }
                } elseif (str_contains($this->subnet, '/')) {
                    // For other subnet sizes, try to parse CIDR
                    $this->generateIPsFromCIDR($this->subnet);
                } else {
                    // Single IP
                    $this->ipQueue = [$this->subnet];
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to generate IP queue: '.$e->getMessage());
            // Fallback to simple range
            $this->ipQueue = ['192.168.1.1', '192.168.1.2'];
        }
    }

    /**
     * Generate IPs from CIDR notation for various subnet sizes
     */
    private function generateIPsFromCIDR(string $cidr): void
    {
        try {
            [$baseIP, $prefixLength] = explode('/', $cidr);
            $prefixLength = (int) $prefixLength;

            // Calculate number of host IPs
            $hostBits = 32 - $prefixLength;
            $numHosts = pow(2, $hostBits) - 2; // Subtract network and broadcast

            // Limit very large subnets to prevent memory issues
            if ($numHosts > 65534) { // Larger than /16
                Log::warning('Subnet too large, limiting to first 1000 IPs', ['cidr' => $cidr]);
                $numHosts = 1000;
            }

            $baseIPLong = ip2long($baseIP);
            $networkAddress = $baseIPLong & ((-1 << $hostBits));

            // Generate all host IPs
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
            // Fallback to single IP
            $this->ipQueue = [explode('/', $cidr)[0]];
        }
    }

    /**
     * Process the next IP in the scan queue
     */
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

            // Update progress
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

            // Use quick scan for fast IP discovery
            $hostInfo = $this->scannerManager->scanHostQuick($currentIP, $this->scanMethods);
            if ($hostInfo) {
                // Add responsive flag to the host info
                $hostInfo['responsive'] = true;
                $hostInfo['scan_order'] = $this->currentIPIndex;
                $this->scanResults[] = $hostInfo;
                $this->foundHosts++;

                Log::info('Host discovered', [
                    'ip' => $currentIP,
                    'hostname' => $hostInfo['hostname'] ?? 'Unknown',
                ]);
            } else {
                // Add non-responsive IP to scan results with special flag
                $noResponseHost = [
                    'ip' => $currentIP,
                    'hostname' => 'No Response',
                    'mac' => 'N/A',
                    'responsive' => false,
                    'scan_order' => $this->currentIPIndex,
                    'services' => [],
                ];
                $this->scanResults[] = $noResponseHost;

                // Also track in the separate array for backwards compatibility
                $this->scannedIPsNoResponse[] = $currentIP;

                Log::debug('No response from IP', [
                    'ip' => $currentIP,
                    'methods' => $this->scanMethods,
                ]);
            }

            // Move to next IP
            $this->currentIPIndex++;

            // If there are more IPs, the JavaScript will call this method again
            // If this was the last IP, completeScan() will be called

        } catch (\Exception $e) {
            Log::error('Error scanning IP: '.$e->getMessage(), [
                'ip' => $this->currentIP,
                'index' => $this->currentIPIndex,
            ]);

            // Track failed scans as no response
            $this->scannedIPsNoResponse[] = $this->currentIP;

            // Move to next IP even if this one failed
            $this->currentIPIndex++;
        }
    }

    /**
     * Complete the scan process
     */
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

    /**
     * Get current scan status for polling
     */
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

    public function toggleHostSelection(int $index): void
    {
        if (in_array($index, $this->selectedHosts)) {
            $this->selectedHosts = array_filter($this->selectedHosts, fn ($i) => $i !== $index);
        } else {
            $this->selectedHosts[] = $index;
        }
    }

    public function selectAllHosts(): void
    {
        // Only select responsive hosts for commit operations
        $responsiveIndexes = [];
        foreach ($this->scanResults as $index => $result) {
            if (isset($result['responsive']) && $result['responsive']) {
                $responsiveIndexes[] = $index;
            }
        }
        $this->selectedHosts = $responsiveIndexes;
    }

    public function deselectAllHosts(): void
    {
        $this->selectedHosts = [];
    }

    public function toggleUnresponsiveIPs(): void
    {
        $this->showUnresponsiveIPs = ! $this->showUnresponsiveIPs;
    }

    public function getVisibleScanResults(): array
    {
        if ($this->showUnresponsiveIPs) {
            return $this->scanResults;
        }

        // Filter to show only responsive hosts
        return array_filter($this->scanResults, function ($result) {
            return isset($result['responsive']) && $result['responsive'];
        });
    }

    public function getUnresponsiveCount(): int
    {
        return count(array_filter($this->scanResults, function ($result) {
            return isset($result['responsive']) && ! $result['responsive'];
        }));
    }

    public function toggleScanMethod(string $method): void
    {
        // Only allow toggling of available scanners
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

        // Ensure at least one method is selected from available methods
        if (empty($this->scanMethods)) {
            $this->scanMethods = [$availableScanners[0] ?? 'ping'];
        }
    }

    public function commitSelectedHosts(): void
    {
        if (empty($this->selectedHosts)) {
            $this->dispatch('commit-failed', 'No hosts selected for commit.');

            return;
        }

        try {
            $selectedHostData = array_intersect_key($this->scanResults, array_flip($this->selectedHosts));

            // Filter out non-responsive hosts from commit operation
            $responsiveHostData = array_filter($selectedHostData, function ($hostData) {
                return isset($hostData['responsive']) && $hostData['responsive'];
            });

            if (empty($responsiveHostData)) {
                $this->dispatch('commit-failed', 'No responsive hosts selected for commit.');

                return;
            }

            $committed = 0;
            foreach ($responsiveHostData as $hostData) {
                $result = $this->commitSingleHost($hostData);
                if ($result) {
                    $committed++;
                }
            }

            // Only clear responsive hosts from results, keep non-responsive ones
            $this->scanResults = array_filter($this->scanResults, function ($result) {
                return isset($result['responsive']) && ! $result['responsive'];
            });
            $this->selectedHosts = [];
            $this->showCommitOptions = count($this->scanResults) > 0;

            $this->dispatch('commit-completed', "Successfully committed {$committed} responsive hosts to the database!");

        } catch (\Exception $e) {
            Log::error('Failed to commit hosts: '.$e->getMessage());
            $this->dispatch('commit-failed', 'Failed to commit hosts: '.$e->getMessage());
        }
    }

    private function commitSingleHost(array $hostData): bool
    {
        try {
            // Use the same logic from ProcessNetworkScan job
            $job = new \App\Jobs\ProcessNetworkScan('', 5, false);

            // We need to simulate what ProcessNetworkScan does but for a single host
            // Let's create the models directly here instead

            // Create or find IP address
            $ipAddress = \App\Models\IPAddress::firstOrCreate([
                'ip_address' => $hostData['ip'],
            ]);

            // Create or find device
            $device = null;
            if (isset($hostData['hostname'])) {
                $device = \App\Models\Device::where('model_name', 'like', "%{$hostData['hostname']}%")->first();
            }

            if (! $device) {
                $device = \App\Models\Device::create([
                    'serial_number' => $hostData['mac'] ?? 'AUTO-'.uniqid(),
                    'model_name' => $hostData['hostname'] ?? 'Unknown Device ('.$hostData['ip'].')',
                    'location_id' => $this->getDefaultLocationId(),
                ]);

                // Log the creation
                \App\Models\History::create([
                    'entity_type' => 'Device',
                    'entity_id' => $device->serial_number,
                    'attribute_changed' => 'created',
                    'old_value' => null,
                    'new_value' => 'Manual scan discovery',
                    'timestamp' => now(),
                ]);
            }

            // Associate IP with device
            $device->ipAddresses()->syncWithoutDetaching([$ipAddress->ip_address_id]);

            // Process services
            if (isset($hostData['services'])) {
                foreach ($hostData['services'] as $serviceData) {
                    $service = \App\Models\Service::firstOrCreate([
                        'name' => $serviceData['name'],
                    ]);

                    $service->ipAddresses()->syncWithoutDetaching([
                        $ipAddress->ip_address_id => ['port_number' => $serviceData['port']],
                    ]);
                }
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to commit single host', [
                'host' => $hostData,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function getDefaultLocationId(): ?int
    {
        $location = \App\Models\Location::firstOrCreate([
            'name' => 'Manual Scan Discoveries',
        ]);

        return $location->location_id;
    }

    public function getScheduledScans(): array
    {
        try {
            $output = Artisan::call('schedule:list');
            $scheduleOutput = Artisan::output();

            // Parse the schedule list to show network scan schedules
            $lines = explode("\n", $scheduleOutput);
            $networkScans = array_filter($lines, function ($line) {
                return str_contains($line, 'network:scan');
            });

            return array_values($networkScans);
        } catch (\Exception $e) {
            return ['Error loading schedule: '.$e->getMessage()];
        }
    }

    public function clearLogs(): void
    {
        try {
            $logFiles = [
                storage_path('logs/network-scan.log'),
                storage_path('logs/network-scan-quick.log'),
                storage_path('logs/network-scan-daily.log'),
                storage_path('logs/network-scan-weekly.log'),
            ];

            foreach ($logFiles as $logFile) {
                if (file_exists($logFile)) {
                    file_put_contents($logFile, '');
                }
            }

            $this->scanHistory = [];
            $this->dispatch('logs-cleared', 'Scan logs cleared successfully!');
        } catch (\Exception $e) {
            $this->dispatch('clear-failed', 'Failed to clear logs: '.$e->getMessage());
        }
    }

    /**
     * Start port scanning on selected hosts
     */
    public function startPortScan(): void
    {
        if (empty($this->selectedHostsForPortScan)) {
            $this->dispatch('port-scan-failed', 'No hosts selected for port scanning.');

            return;
        }

        $this->portScanning = true;
        $this->portScanResults = [];

        try {
            // Parse custom ports if provided
            $ports = [];
            if (! empty($this->customPorts)) {
                $ports = $this->scannerManager->parsePorts(implode(',', $this->customPorts));
            } else {
                // Use common ports from port scanner
                $ports = $this->scannerManager->getCommonPorts();
            }

            // Get selected host IPs
            $hostIps = [];
            foreach ($this->selectedHostsForPortScan as $index) {
                if (isset($this->scanResults[$index])) {
                    $hostIps[] = $this->scanResults[$index]['ip'];
                }
            }

            if (empty($hostIps)) {
                $this->dispatch('port-scan-failed', 'Selected hosts not found in scan results.');

                return;
            }

            // Set progress callback
            $this->scannerManager->setProgressCallback(function ($source, $phase, $target, $data) {
                $this->portScanProgress = [
                    'source' => $source,
                    'phase' => $phase,
                    'target' => $target,
                    'data' => $data,
                ];
            });

            if ($this->scanAllHosts) {
                // Scan all selected hosts at once
                $results = $this->scannerManager->scanPortsMultiple($hostIps, $ports);
                $this->portScanResults = $results;
            } else {
                // Scan each host individually (for UI feedback)
                foreach ($hostIps as $ip) {
                    $portResults = $this->scannerManager->scanPorts($ip, $ports);
                    if (! empty($portResults)) {
                        $this->portScanResults[$ip] = $portResults;
                    }
                }
            }

            $totalOpenPorts = array_sum(array_map('count', $this->portScanResults));
            $this->dispatch('port-scan-completed', "Port scan completed! Found {$totalOpenPorts} open ports across ".count($this->portScanResults).' hosts.');

        } catch (\Exception $e) {
            $this->dispatch('port-scan-failed', 'Port scan failed: '.$e->getMessage());
        } finally {
            $this->portScanning = false;
        }
    }

    /**
     * Start port scan on a single host
     */
    public function scanSingleHostPorts(int $hostIndex): void
    {
        if (! isset($this->scanResults[$hostIndex])) {
            $this->dispatch('port-scan-failed', 'Host not found in scan results.');

            return;
        }

        $host = $this->scanResults[$hostIndex];
        $ip = $host['ip'];

        $this->portScanning = true;

        try {
            // Parse custom ports if provided
            $ports = [];
            if (! empty($this->customPorts)) {
                $ports = $this->scannerManager->parsePorts(implode(',', $this->customPorts));
            } else {
                $ports = $this->scannerManager->getCommonPorts();
            }

            // Set progress callback
            $this->scannerManager->setProgressCallback(function ($source, $phase, $target, $data) {
                $this->portScanProgress = [
                    'source' => $source,
                    'phase' => $phase,
                    'target' => $target,
                    'data' => $data,
                ];
            });

            $portResults = $this->scannerManager->scanPorts($ip, $ports);

            if (! empty($portResults)) {
                $this->portScanResults[$ip] = $portResults;
                $this->dispatch('port-scan-completed', 'Found '.count($portResults)." open ports on {$ip}.");
            } else {
                $this->dispatch('port-scan-completed', "No open ports found on {$ip}.");
            }

        } catch (\Exception $e) {
            $this->dispatch('port-scan-failed', 'Port scan failed: '.$e->getMessage());
        } finally {
            $this->portScanning = false;
        }
    }

    /**
     * Toggle port scanning on host
     */
    public function togglePortScanHost(int $hostIndex): void
    {
        if (in_array($hostIndex, $this->selectedHostsForPortScan)) {
            $this->selectedHostsForPortScan = array_filter($this->selectedHostsForPortScan, fn ($index) => $index !== $hostIndex);
        } else {
            $this->selectedHostsForPortScan[] = $hostIndex;
        }
    }

    /**
     * Select all hosts for port scanning
     */
    public function selectAllForPortScan(): void
    {
        $this->selectedHostsForPortScan = array_keys($this->scanResults);
    }

    /**
     * Clear port scan selections
     */
    public function clearPortScanSelection(): void
    {
        $this->selectedHostsForPortScan = [];
    }

    /**
     * Add custom port
     */
    public function addCustomPort(string $portInput): void
    {
        $ports = $this->scannerManager->parsePorts($portInput);
        foreach ($ports as $port) {
            if (! in_array($port, $this->customPorts)) {
                $this->customPorts[] = $port;
            }
        }
        sort($this->customPorts);
        $this->customPortInput = ''; // Reset the input
    }

    /**
     * Remove custom port
     */
    public function removeCustomPort(int $port): void
    {
        $this->customPorts = array_filter($this->customPorts, fn ($p) => $p !== $port);
        $this->customPorts = array_values($this->customPorts);
    }

    /**
     * Reset port scan data
     */
    public function resetPortScan(): void
    {
        $this->portScanEnabled = false;
        $this->portScanning = false;
        $this->portScanInProgress = false;
        $this->scanAllHosts = false;
        $this->selectedHostsForPortScan = [];
        $this->portScanResults = [];
        $this->portScanProgress = [];
        $this->portQueue = [];
        $this->hostQueue = [];
        $this->currentPortIndex = 0;
        $this->currentHostIndex = 0;
        $this->completedPortScans = 0;
        $this->currentPortScanHost = '';
        $this->currentPortScanPort = '';
    }

    /**
     * Scan all hosts with common ports
     */
    public function scanAllHostsCommon(): void
    {
        if ($this->scanInProgress) {
            $this->dispatch('port-scan-failed', 'Cannot start port scan while device scan is in progress.');

            return;
        }
        $this->startChunkedPortScan('common');
    }

    /**
     * Scan all hosts with extended ports
     */
    public function scanAllHostsExtended(): void
    {
        if ($this->scanInProgress) {
            $this->dispatch('port-scan-failed', 'Cannot start port scan while device scan is in progress.');

            return;
        }
        $this->startChunkedPortScan('extended');
    }

    /**
     * Scan all hosts with custom ports (prompt for input)
     */
    public function scanAllHostsCustom(): void
    {
        // Dispatch event to show JavaScript prompt
        $this->dispatch('prompt-custom-ports-all');
    }

    /**
     * Scan single host with common ports
     */
    public function scanSingleHostCommon(int $hostIndex): void
    {
        if ($this->scanInProgress) {
            $this->dispatch('port-scan-failed', 'Cannot start port scan while device scan is in progress.');

            return;
        }
        $this->startChunkedPortScanSingleHost($hostIndex, 'common');
    }

    /**
     * Scan single host with extended ports
     */
    public function scanSingleHostExtended(int $hostIndex): void
    {
        if ($this->scanInProgress) {
            $this->dispatch('port-scan-failed', 'Cannot start port scan while device scan is in progress.');

            return;
        }
        $this->startChunkedPortScanSingleHost($hostIndex, 'extended');
    }

    /**
     * Scan single host with custom ports (prompt for input)
     */
    public function scanSingleHostCustom(int $hostIndex): void
    {
        // Store the host index for later use
        session(['pending_host_index' => $hostIndex]);

        // Dispatch event to show JavaScript prompt
        $this->dispatch('prompt-custom-ports-single');
    }

    /**
     * Generic method to scan all hosts with specified port type
     */
    private function scanAllHostsWithPorts(string $portType, array $customPorts = []): void
    {
        if (empty($this->scanResults)) {
            $this->dispatch('port-scan-failed', 'No hosts available for scanning.');

            return;
        }

        $this->portScanning = true;

        try {
            // Get ports based on type
            $ports = $this->getPortsByType($portType, $customPorts);

            if (empty($ports)) {
                $this->dispatch('port-scan-failed', 'No ports specified for scanning.');

                return;
            }

            // Get all host IPs
            $hostIps = array_column($this->scanResults, 'ip');

            // Set progress callback
            $this->scannerManager->setProgressCallback(function ($source, $phase, $target, $data) {
                $this->portScanProgress = [
                    'source' => $source,
                    'phase' => $phase,
                    'target' => $target,
                    'data' => $data,
                ];
            });

            // Scan all hosts
            $results = $this->scannerManager->scanPortsMultiple($hostIps, $ports);

            // Merge results
            foreach ($results as $ip => $portResults) {
                $this->portScanResults[$ip] = $portResults;
            }

            $totalOpenPorts = array_sum(array_map('count', $results));
            $this->dispatch('port-scan-completed', "Bulk scan completed! Found {$totalOpenPorts} open ports across ".count($results)." hosts using {$portType} ports.");

        } catch (\Exception $e) {
            $this->dispatch('port-scan-failed', 'Bulk port scan failed: '.$e->getMessage());
        } finally {
            $this->portScanning = false;
        }
    }

    /**
     * Generic method to scan single host with specified port type
     */
    private function scanSingleHostWithPorts(int $hostIndex, string $portType, array $customPorts = []): void
    {
        if (! isset($this->scanResults[$hostIndex])) {
            $this->dispatch('port-scan-failed', 'Host not found in scan results.');

            return;
        }

        $host = $this->scanResults[$hostIndex];
        $ip = $host['ip'];

        $this->portScanning = true;

        try {
            // Get ports based on type
            $ports = $this->getPortsByType($portType, $customPorts);

            if (empty($ports)) {
                $this->dispatch('port-scan-failed', 'No ports specified for scanning.');

                return;
            }

            // Set progress callback
            $this->scannerManager->setProgressCallback(function ($source, $phase, $target, $data) {
                $this->portScanProgress = [
                    'source' => $source,
                    'phase' => $phase,
                    'target' => $target,
                    'data' => $data,
                ];
            });

            $portResults = $this->scannerManager->scanPorts($ip, $ports);

            if (! empty($portResults)) {
                $this->portScanResults[$ip] = $portResults;
                $this->dispatch('port-scan-completed', 'Found '.count($portResults)." open ports on {$ip} using {$portType} ports.");
            } else {
                $this->dispatch('port-scan-completed', "No open ports found on {$ip} using {$portType} ports.");
            }

        } catch (\Exception $e) {
            $this->dispatch('port-scan-failed', 'Port scan failed: '.$e->getMessage());
        } finally {
            $this->portScanning = false;
        }
    }

    /**
     * Get ports array based on type
     */
    private function getPortsByType(string $portType, array $customPorts = []): array
    {
        switch ($portType) {
            case 'common':
                return $this->scannerManager->getCommonPorts();
            case 'extended':
                return $this->scannerManager->getExtendedPorts();
            case 'custom':
                return $customPorts;
            default:
                return [];
        }
    }

    /**
     * Prompt user for custom ports (using browser prompt)
     */
    private function promptForCustomPorts(): array
    {
        // Dispatch event to show JavaScript prompt
        $this->dispatch('prompt-custom-ports');

        // For now, return empty array - the JavaScript will handle the prompt
        // and call a method with the result
        return [];
    }

    /**
     * Handle custom ports input from JavaScript prompt
     */
    public function handleCustomPortsInput(string $portString): void
    {
        if (empty($portString)) {
            $this->dispatch('port-scan-failed', 'No ports specified.');

            return;
        }

        $customPorts = $this->scannerManager->parsePorts($portString);
        if (empty($customPorts)) {
            $this->dispatch('port-scan-failed', 'Invalid port specification.');

            return;
        }

        // Store the custom ports temporarily
        $this->customPorts = $customPorts;

        // Trigger the appropriate scan based on what was requested
        // This will be handled by the JavaScript callback
    }

    /**
     * Handle custom ports input for all hosts scan
     */
    public function handleCustomPortsAllHosts(string $portString): void
    {
        if (empty($portString)) {
            $this->dispatch('port-scan-failed', 'No ports specified.');

            return;
        }

        $customPorts = $this->scannerManager->parsePorts($portString);
        if (empty($customPorts)) {
            $this->dispatch('port-scan-failed', 'Invalid port specification.');

            return;
        }

        if ($this->scanInProgress) {
            $this->dispatch('port-scan-failed', 'Cannot start port scan while device scan is in progress.');

            return;
        }

        $this->startChunkedPortScan('custom', $customPorts);
    }

    /**
     * Handle custom ports input for single host scan
     */
    public function handleCustomPortsSingleHost(string $portString): void
    {
        if (empty($portString)) {
            $this->dispatch('port-scan-failed', 'No ports specified.');

            return;
        }

        $customPorts = $this->scannerManager->parsePorts($portString);
        if (empty($customPorts)) {
            $this->dispatch('port-scan-failed', 'Invalid port specification.');

            return;
        }

        $hostIndex = session('pending_host_index');
        if ($hostIndex === null) {
            $this->dispatch('port-scan-failed', 'Host index not found.');

            return;
        }

        if ($this->scanInProgress) {
            $this->dispatch('port-scan-failed', 'Cannot start port scan while device scan is in progress.');

            return;
        }

        $this->startChunkedPortScanSingleHost($hostIndex, 'custom', $customPorts);

        // Clear the session data
        session()->forget('pending_host_index');
    }

    /**
     * Start chunked port scanning for all hosts
     */
    public function startChunkedPortScan(string $portType, array $customPorts = []): void
    {
        if (empty($this->scanResults)) {
            $this->dispatch('port-scan-failed', 'No hosts available for scanning.');

            return;
        }

        if ($this->portScanInProgress) {
            $this->dispatch('port-scan-failed', 'Port scan already in progress.');

            return;
        }

        // Get ports based on type
        $ports = $this->getPortsByType($portType, $customPorts);
        if (empty($ports)) {
            $this->dispatch('port-scan-failed', 'No ports specified for scanning.');

            return;
        }

        // Initialize chunked port scanning
        $this->resetPortScanProgress();
        $this->portScanning = true;
        $this->portScanInProgress = true;
        $this->portScanId = uniqid('port_scan_');

        // Setup scan queues
        $this->hostQueue = array_column($this->scanResults, 'ip');
        $this->portQueue = $ports;
        $this->currentHostIndex = 0;
        $this->currentPortIndex = 0;
        $this->totalPorts = count($ports);
        $this->totalPortScans = count($this->hostQueue) * count($ports);
        $this->completedPortScans = 0;

        // Initialize progress
        $this->portScanProgress = [
            'source' => 'port',
            'phase' => 'Starting',
            'target' => 'All hosts',
            'data' => [
                'scanned' => 0,
                'total' => $this->totalPortScans,
                'hosts' => count($this->hostQueue),
                'ports' => count($ports),
            ],
        ];

        Log::info('Starting chunked port scan', [
            'port_type' => $portType,
            'hosts' => count($this->hostQueue),
            'ports' => count($ports),
            'total_scans' => $this->totalPortScans,
        ]);

        // Start the port scanning process
        $this->dispatch('start-port-polling');
    }

    /**
     * Start chunked port scanning for single host
     */
    public function startChunkedPortScanSingleHost(int $hostIndex, string $portType, array $customPorts = []): void
    {
        if (! isset($this->scanResults[$hostIndex])) {
            $this->dispatch('port-scan-failed', 'Host not found in scan results.');

            return;
        }

        if ($this->portScanInProgress) {
            $this->dispatch('port-scan-failed', 'Port scan already in progress.');

            return;
        }

        // Get ports based on type
        $ports = $this->getPortsByType($portType, $customPorts);
        if (empty($ports)) {
            $this->dispatch('port-scan-failed', 'No ports specified for scanning.');

            return;
        }

        $host = $this->scanResults[$hostIndex];
        $ip = $host['ip'];

        // Initialize chunked port scanning for single host
        $this->resetPortScanProgress();
        $this->portScanning = true;
        $this->portScanInProgress = true;
        $this->portScanId = uniqid('port_scan_');

        // Setup scan queues
        $this->hostQueue = [$ip];
        $this->portQueue = $ports;
        $this->currentHostIndex = 0;
        $this->currentPortIndex = 0;
        $this->totalPorts = count($ports);
        $this->totalPortScans = count($ports);
        $this->completedPortScans = 0;

        // Initialize progress
        $this->portScanProgress = [
            'source' => 'port',
            'phase' => 'Starting',
            'target' => $ip,
            'data' => [
                'scanned' => 0,
                'total' => $this->totalPortScans,
                'hosts' => 1,
                'ports' => count($ports),
            ],
        ];

        Log::info('Starting chunked port scan for single host', [
            'host' => $ip,
            'port_type' => $portType,
            'ports' => count($ports),
        ]);

        // Start the port scanning process
        $this->dispatch('start-port-polling');
    }

    /**
     * Process the next port in the scan queue
     */
    public function processPortScanChunk(): void
    {
        if (! $this->portScanInProgress) {
            return;
        }

        // Check if we've completed all hosts
        if ($this->currentHostIndex >= count($this->hostQueue)) {
            $this->completePortScan();

            return;
        }

        // Check if we've completed all ports for current host
        if ($this->currentPortIndex >= count($this->portQueue)) {
            // Move to next host
            $this->currentHostIndex++;
            $this->currentPortIndex = 0;

            // If there are more hosts, continue
            if ($this->currentHostIndex < count($this->hostQueue)) {
                // JavaScript will call this method again
                return;
            } else {
                // All done
                $this->completePortScan();

                return;
            }
        }

        try {
            $currentHost = $this->hostQueue[$this->currentHostIndex];
            $currentPort = $this->portQueue[$this->currentPortIndex];

            $this->currentPortScanHost = $currentHost;
            $this->currentPortScanPort = (string) $currentPort;

            // Update progress
            $this->completedPortScans++;
            $percentage = round(($this->completedPortScans / $this->totalPortScans) * 100);

            $this->portScanProgress = [
                'source' => 'port',
                'phase' => 'Port Scanning',
                'target' => "{$currentHost}:{$currentPort}",
                'data' => [
                    'scanned' => $this->completedPortScans,
                    'total' => $this->totalPortScans,
                    'current_host' => $currentHost,
                    'current_port' => $currentPort,
                    'percentage' => $percentage,
                ],
            ];

            Log::debug('Scanning port', [
                'host' => $currentHost,
                'port' => $currentPort,
                'progress' => "{$this->completedPortScans}/{$this->totalPortScans}",
            ]);

            // Scan single port on single host
            $portResults = $this->scannerManager->scanPorts($currentHost, [$currentPort]);

            if (! empty($portResults)) {
                // Initialize host results if not exists
                if (! isset($this->portScanResults[$currentHost])) {
                    $this->portScanResults[$currentHost] = [];
                }

                // Add the port result
                $this->portScanResults[$currentHost] = array_merge(
                    $this->portScanResults[$currentHost],
                    $portResults
                );

                Log::info('Open port found', [
                    'host' => $currentHost,
                    'port' => $currentPort,
                    'service' => $portResults[0]['service'] ?? 'unknown',
                ]);
            }

            // Move to next port
            $this->currentPortIndex++;

        } catch (\Exception $e) {
            Log::error('Port scan chunk failed', [
                'host' => $this->currentPortScanHost,
                'port' => $this->currentPortScanPort,
                'error' => $e->getMessage(),
            ]);

            // Continue to next port even if this one fails
            $this->currentPortIndex++;
        }
    }

    /**
     * Complete the port scan process
     */
    private function completePortScan(): void
    {
        $this->portScanning = false;
        $this->portScanInProgress = false;

        $totalOpenPorts = array_sum(array_map('count', $this->portScanResults));
        $totalHostsScanned = count($this->hostQueue);
        $hostsWithOpenPorts = count($this->portScanResults);

        $this->portScanProgress = [
            'source' => 'port',
            'phase' => 'Completed',
            'target' => 'All hosts',
            'data' => [
                'scanned' => $this->totalPortScans,
                'total' => $this->totalPortScans,
                'percentage' => 100,
            ],
        ];

        Log::info('Port scan completed', [
            'total_scans' => $this->totalPortScans,
            'open_ports' => $totalOpenPorts,
            'hosts_scanned' => $totalHostsScanned,
            'hosts_with_ports' => $hostsWithOpenPorts,
        ]);

        $this->dispatch('port-scan-completed',
            "Port scan completed! Found {$totalOpenPorts} open ports across {$hostsWithOpenPorts} of {$totalHostsScanned} hosts.");
    }

    /**
     * Reset port scan progress tracking
     */
    private function resetPortScanProgress(): void
    {
        $this->currentHostIndex = 0;
        $this->currentPortIndex = 0;
        $this->completedPortScans = 0;
        $this->currentPortScanHost = '';
        $this->currentPortScanPort = '';
        $this->portScanProgress = [];
    }

    public function render()
    {
        return view('livewire.network-scan-manager', [
            'scheduledScans' => $this->getScheduledScans(),
        ]);
    }
}

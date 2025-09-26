<?php

namespace App\Services;

use App\Services\Scanners\ArpScanner;
use App\Services\Scanners\BaseScanner;
use App\Services\Scanners\PingScanner;
use App\Services\Scanners\PortScanner;
use App\Services\Scanners\ScanResult;
use Illuminate\Support\Facades\Log;

class NetworkScannerManager
{
    private array $scanners = [];

    private $progressCallback = null;

    private int $timeout = 5;

    private array $config = [];

    public function __construct(int $timeout = 5, array $config = [])
    {
        $this->timeout = $timeout;
        $this->config = $config;
        $this->initializeScanners();
    }

    /**
     * Initialize available scanners
     */
    private function initializeScanners(): void
    {
        $scannerClasses = [
            'arp' => ArpScanner::class,
            'ping' => PingScanner::class,
            'port' => PortScanner::class,
        ];

        foreach ($scannerClasses as $name => $class) {
            /** @var BaseScanner $scanner */
            $scanner = new $class($this->timeout, $this->config);

            if ($scanner->isAvailable()) {
                $this->scanners[$name] = $scanner;
                Log::info("NetworkScannerManager: {$name} scanner initialized and available");
            } else {
                Log::warning("NetworkScannerManager: {$name} scanner not available on this system");
            }
        }
    }

    /**
     * Set a progress callback function
     */
    public function setProgressCallback(?callable $callback = null): self
    {
        $this->progressCallback = $callback;

        // Set callback on all scanners
        foreach ($this->scanners as $scanner) {
            $scanner->setProgressCallback($this->createScannerCallback());
        }

        return $this;
    }

    /**
     * Create a callback wrapper for individual scanners
     */
    private function createScannerCallback(): callable
    {
        return function (string $scannerName, string $phase, string $currentTarget = '', array $data = []) {
            if ($this->progressCallback) {
                call_user_func(
                    $this->progressCallback,
                    $scannerName,
                    $phase,
                    $currentTarget,
                    $data
                );
            }
        };
    }

    /**
     * Set timeout for all scanners
     */
    public function setTimeout(int $timeout): self
    {
        $this->timeout = $timeout;

        foreach ($this->scanners as $scanner) {
            $scanner->setTimeout($timeout);
        }

        return $this;
    }

    /**
     * Set configuration for all scanners
     */
    public function setConfig(array $config): self
    {
        $this->config = array_merge($this->config, $config);

        foreach ($this->scanners as $scanner) {
            $scanner->setConfig($this->config);
        }

        return $this;
    }

    /**
     * Get available scanner names
     */
    public function getAvailableScanners(): array
    {
        return array_keys($this->scanners);
    }

    /**
     * Check if a specific scanner is available
     */
    public function hasScannerByName(string $name): bool
    {
        return isset($this->scanners[$name]);
    }

    /**
     * Get a specific scanner instance
     */
    public function getScanner(string $name): ?BaseScanner
    {
        return $this->scanners[$name] ?? null;
    }

    /**
     * Scan a subnet using specified methods
     */
    public function scanSubnet(string $subnet, array $methods = ['arp', 'ping']): ScanResult
    {
        $startTime = microtime(true);

        Log::info('NetworkScannerManager: Starting scan', [
            'subnet' => $subnet,
            'methods' => $methods,
            'timeout' => $this->timeout,
            'available_scanners' => $this->getAvailableScanners(),
        ]);

        $this->reportProgress('scan_manager', 'Starting', 'Initializing scan');

        // Filter methods to only available scanners
        $availableMethods = array_intersect($methods, $this->getAvailableScanners());

        if (empty($availableMethods)) {
            Log::error('NetworkScannerManager: No available scanners for requested methods', [
                'requested' => $methods,
                'available' => $this->getAvailableScanners(),
            ]);

            return new ScanResult([], $subnet);
        }

        // Initialize combined result
        $combinedResult = new ScanResult([], $subnet);
        $combinedResult->setScanMethods($availableMethods);

        // Execute scanners in order of efficiency (ARP first, then ping)
        $scanOrder = ['arp', 'ping'];
        $usedMethods = [];

        foreach ($scanOrder as $method) {
            if (! in_array($method, $availableMethods)) {
                continue;
            }

            $this->reportProgress('scan_manager', 'Running Scanner', $method);

            try {
                $scanner = $this->scanners[$method];
                $scanResult = $scanner->scanSubnet($subnet);

                // Merge results
                $combinedResult->mergeScanResult($scanResult);
                $usedMethods[] = $method;

                Log::info("NetworkScannerManager: {$method} scanner completed", [
                    'hosts_found' => $scanResult->count(),
                    'duration' => $scanResult->getScanDuration(),
                ]);

            } catch (\Exception $e) {
                Log::error("NetworkScannerManager: {$method} scanner failed", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        $totalDuration = microtime(true) - $startTime;
        $combinedResult->setScanDuration($totalDuration);
        $combinedResult->setScanMethods($usedMethods);

        // Add manager metadata
        $managerMetadata = [
            'manager_version' => '1.0',
            'scanners_used' => $usedMethods,
            'total_duration' => $totalDuration,
            'scan_timestamp' => now()->toISOString(),
        ];

        $combinedResult->setMetadata($managerMetadata);

        Log::info('NetworkScannerManager: Scan completed', [
            'subnet' => $subnet,
            'total_hosts' => $combinedResult->count(),
            'alive_hosts' => $combinedResult->getAliveHosts()->count(),
            'scanners_used' => $usedMethods,
            'total_duration' => $totalDuration,
        ]);

        $this->reportProgress('scan_manager', 'Completed', '', [
            'total_hosts' => $combinedResult->count(),
            'alive_hosts' => $combinedResult->getAliveHosts()->count(),
            'duration' => $totalDuration,
        ]);

        return $combinedResult;
    }

    /**
     * Scan a single host with detailed information
     */
    public function scanHost(string $ip, array $methods = ['ping', 'arp']): ?array
    {
        Log::info('NetworkScannerManager: Scanning single host', [
            'ip' => $ip,
            'methods' => $methods,
        ]);

        // For single host, we can use ping scanner with the IP as a /32 subnet
        $availableMethods = array_intersect($methods, $this->getAvailableScanners());

        if (empty($availableMethods)) {
            return null;
        }

        // Try ping first for single host
        if (in_array('ping', $availableMethods)) {
            $result = $this->scanSubnet($ip, ['ping']);
            if ($result->count() > 0) {
                return $result->first();
            }
        }

        // Fallback to ARP if available
        if (in_array('arp', $availableMethods)) {
            $result = $this->scanSubnet($ip, ['arp']);
            if ($result->count() > 0) {
                return $result->first();
            }
        }

        return null;
    }

    /**
     * Quick scan a single host - can include hostname resolution if timeout allows
     */
    public function scanHostQuick(string $ip, array $methods = ['ping']): ?array
    {
        Log::info('NetworkScannerManager: Quick scanning single host', [
            'ip' => $ip,
            'methods' => $methods,
        ]);

        // Try ping scanner directly for speed
        if (in_array('ping', $methods) && isset($this->scanners['ping'])) {
            $pingScanner = $this->scanners['ping'];

            // Use reflection to call pingHost directly
            try {
                $reflectionMethod = new \ReflectionMethod($pingScanner, 'pingHost');
                $reflectionMethod->setAccessible(true);
                $isAlive = $reflectionMethod->invoke($pingScanner, $ip);

                if ($isAlive) {
                    // Try to get hostname, but don't worry if it fails
                    $hostname = null;
                    try {
                        $hostname = gethostbyaddr($ip);
                        $hostname = ($hostname !== $ip) ? $hostname : null;
                    } catch (\Exception $e) {
                        // Hostname lookup failed, continue without it
                    }

                    return [
                        'ip' => $ip,
                        'hostname' => $hostname,
                        'mac' => null, // Skip MAC lookup for now
                        'discovery_method' => 'ping',
                        'discovered_at' => now()->toDateTimeString(),
                        'response_time' => null,
                        'services' => [],
                    ];
                }
            } catch (\Exception $e) {
                Log::debug('Quick ping failed: '.$e->getMessage());
            }
        }

        // Try ARP as fallback
        if (in_array('arp', $methods) && isset($this->scanners['arp'])) {
            try {
                // Use the full ARP scanner capability
                $result = $this->scanSubnet($ip, ['arp']);
                if ($result->count() > 0) {
                    return $result->first();
                }
            } catch (\Exception $e) {
                Log::debug('Quick ARP failed: '.$e->getMessage());
            }
        }

        return null;
    }

    /**
     * Report progress to callback
     */
    private function reportProgress(string $source, string $phase, string $target = '', array $data = []): void
    {
        if ($this->progressCallback) {
            call_user_func($this->progressCallback, $source, $phase, $target, $data);
        }
    }

    /**
     * Get scanner statistics
     */
    public function getStatistics(): array
    {
        $stats = [
            'available_scanners' => count($this->scanners),
            'scanners' => [],
        ];

        foreach ($this->scanners as $name => $scanner) {
            $stats['scanners'][$name] = [
                'class' => get_class($scanner),
                'available' => $scanner->isAvailable(),
                'timeout' => $scanner->getTimeout(),
            ];
        }

        return $stats;
    }

    /**
     * Scan ports on a specific host
     */
    public function scanPorts(string $ip, array $ports = []): array
    {
        if (! isset($this->scanners['port'])) {
            Log::warning('Port scanner not available');

            return [];
        }

        /** @var PortScanner $portScanner */
        $portScanner = $this->scanners['port'];

        // Set progress callback
        $portScanner->setProgressCallback($this->progressCallback);

        return $portScanner->scanHost($ip, $ports);
    }

    /**
     * Scan ports on multiple hosts
     */
    public function scanPortsMultiple(array $hosts, array $ports = []): array
    {
        if (! isset($this->scanners['port'])) {
            Log::warning('Port scanner not available');

            return [];
        }

        $results = [];
        $totalHosts = count($hosts);
        $scannedHosts = 0;

        foreach ($hosts as $host) {
            $scannedHosts++;

            // Report progress
            if ($this->progressCallback) {
                call_user_func($this->progressCallback, 'port_scan', 'Scanning Host', $host, [
                    'scanned' => $scannedHosts,
                    'total' => $totalHosts,
                ]);
            }

            $portResults = $this->scanPorts($host, $ports);
            if (! empty($portResults)) {
                $results[$host] = $portResults;
            }
        }

        return $results;
    }

    /**
     * Get common ports for scanning
     */
    public function getCommonPorts(): array
    {
        if (isset($this->scanners['port'])) {
            /** @var PortScanner $portScanner */
            $portScanner = $this->scanners['port'];

            return $portScanner->getCommonPorts();
        }

        return [];
    }

    /**
     * Get extended ports for thorough scanning
     */
    public function getExtendedPorts(): array
    {
        if (isset($this->scanners['port'])) {
            /** @var PortScanner $portScanner */
            $portScanner = $this->scanners['port'];

            return $portScanner->getExtendedPorts();
        }

        return [];
    }

    /**
     * Parse port string into array
     */
    public function parsePorts(string $portString): array
    {
        if (isset($this->scanners['port'])) {
            /** @var PortScanner $portScanner */
            $portScanner = $this->scanners['port'];

            return $portScanner->parsePorts($portString);
        }

        return [];
    }
}

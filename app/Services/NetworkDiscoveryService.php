<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class NetworkDiscoveryService
{
    private $progressCallback = null;

    /**
     * Set a progress callback function
     */
    public function setProgressCallback(?callable $callback = null): void
    {
        $this->progressCallback = $callback;
    }

    /**
     * Call the progress callback if set
     */
    private function reportProgress(string $phase, string $currentIP = '', ?int $scanned = null, ?int $found = null): void
    {
        if ($this->progressCallback) {
            call_user_func($this->progressCallback, $phase, $currentIP, $scanned, $found);
        }
    }

    /**
     * Scan a subnet for active hosts and their services using multiple methods
     */
    public function scanSubnet(string $subnet, int $timeout = 5, array $methods = ['ping', 'arp']): array
    {
        // Add time tracking to prevent exceeding execution limits (extended for progress bar)
        $startTime = microtime(true);
        $maxExecutionTime = 120; // Extended to 2 minutes with progress feedback

        $hosts = [];

        // Parse subnet to get IP range
        $ipRange = $this->parseSubnet($subnet);

        // Limit the number of IPs to scan - more reasonable limit with progress bar
        $maxIpsToScan = config('network-discovery.security.max_scan_range', 50); // Increased back to 50 with progress
        if (count($ipRange) > $maxIpsToScan) {
            Log::warning("Subnet {$subnet} has ".count($ipRange)." IPs, limiting to {$maxIpsToScan} for performance");
            $ipRange = array_slice($ipRange, 0, $maxIpsToScan);
        }

        // Report initial progress
        $this->reportProgress('Starting scan', '', 0, 0);

        // Use different discovery methods in order of efficiency
        $discoveredHosts = [];
        $scannedCount = 0;
        $foundCount = 0;

        if (in_array('arp', $methods)) {
            Log::info("Starting ARP-based discovery for subnet {$subnet}");

            $this->reportProgress('ARP Discovery', 'Reading ARP table', $scannedCount, $foundCount);

            // Check execution time before ARP discovery
            if ((microtime(true) - $startTime) > $maxExecutionTime) {
                Log::warning('Scan timeout before ARP discovery - returning partial results');

                return $discoveredHosts;
            }

            // First, populate ARP table by pinging a few IPs to wake up devices
            $this->populateARPTable($subnet);

            $arpHosts = $this->discoverHostsViaARP($subnet);
            $discoveredHosts = array_merge($discoveredHosts, $arpHosts);
            $foundCount = count($discoveredHosts);

            Log::info('ARP discovery found '.count($arpHosts).' hosts');
            $this->reportProgress('ARP Complete', '', $scannedCount, $foundCount);
        }

        if (in_array('ping', $methods)) {
            Log::info("Starting ping-based discovery for subnet {$subnet}");

            $this->reportProgress('Ping Discovery', 'Preparing IP list', $scannedCount, $foundCount);

            // Check execution time before ping discovery
            if ((microtime(true) - $startTime) > $maxExecutionTime) {
                Log::warning('Scan timeout before ping discovery - returning ARP results only');

                return array_values($discoveredHosts);
            }

            // If we already have ARP results, only ping IPs not found via ARP
            $arpIPs = array_column($discoveredHosts, 'ip');
            $ipRange = array_diff($ipRange, $arpIPs);

            if (! empty($ipRange)) {
                // Use concurrent scanning for better performance
                $chunks = array_chunk($ipRange, 10); // Process 10 IPs at a time

                foreach ($chunks as $chunkIndex => $ipChunk) {
                    // Check execution time before each chunk
                    if ((microtime(true) - $startTime) > $maxExecutionTime) {
                        Log::warning('Scan timeout during ping discovery - returning partial results');
                        break;
                    }

                    $this->reportProgress('Ping Discovery', 'Chunk '.($chunkIndex + 1).'/'.count($chunks), $scannedCount, $foundCount);

                    $chunkHosts = $this->scanIPChunk($ipChunk, $timeout);
                    $discoveredHosts = array_merge($discoveredHosts, $chunkHosts);

                    $scannedCount += count($ipChunk);
                    $foundCount = count($discoveredHosts);

                    $this->reportProgress('Ping Discovery', 'Processed chunk '.($chunkIndex + 1), $scannedCount, $foundCount);

                    // Add a small delay between chunks to prevent overwhelming the network
                    usleep(50000); // 0.05 seconds
                }
            }

            Log::info('Ping discovery found '.(count($discoveredHosts) - count($arpHosts ?? [])).' additional hosts');
        }        // Remove duplicates based on IP address
        $uniqueHosts = [];
        foreach ($discoveredHosts as $host) {
            $ip = $host['ip'];
            if (! isset($uniqueHosts[$ip])) {
                $uniqueHosts[$ip] = $host;
            } else {
                // Merge data from different discovery methods
                $uniqueHosts[$ip] = $this->mergeHostData($uniqueHosts[$ip], $host);
            }
        }

        return array_values($uniqueHosts);
    }

    /**
     * Scan a chunk of IPs concurrently for better performance
     */
    private function scanIPChunk(array $ips, int $timeout): array
    {
        $hosts = [];

        // Quick ping sweep first to identify live hosts
        $liveIPs = [];
        foreach ($ips as $ip) {
            $this->reportProgress('Pinging', $ip);
            if ($this->isHostAlive($ip, min($timeout, 2))) { // Use max 2 seconds for ping
                $liveIPs[] = $ip;
            }
        }

        // Only do detailed scanning on live hosts
        foreach ($liveIPs as $ip) {
            $this->reportProgress('Scanning', $ip);
            $hostInfo = $this->scanHostDetailed($ip, $timeout);
            if ($hostInfo) {
                $hosts[] = $hostInfo;
            }
        }

        return $hosts;
    }

    /**
     * Scan a single host for information (lightweight version)
     */
    public function scanHost(string $ip, int $timeout = 5): ?array
    {
        // Quick check if host is alive
        if (! $this->isHostAlive($ip, min($timeout, 2))) {
            return null;
        }

        // Return basic info for quick scans
        $hostInfo = [
            'ip' => $ip,
            'hostname' => $this->getHostname($ip),
            'discovered_at' => now()->toISOString(),
        ];

        Log::debug("Quick scan discovered host: {$ip}");

        return $hostInfo;
    }

    /**
     * Detailed scan of a single host including services and OS detection
     */
    public function scanHostDetailed(string $ip, int $timeout = 5): ?array
    {
        $hostInfo = [
            'ip' => $ip,
            'hostname' => $this->getHostname($ip),
            'mac' => $this->getMacAddress($ip),
            'services' => $this->scanServices($ip, min($timeout, 3)), // Limit service scan timeout
            'os_info' => null, // Skip OS detection for performance
            'discovered_at' => now()->toISOString(),
        ];

        Log::info("Detailed scan discovered host: {$ip}", $hostInfo);

        return $hostInfo;
    }

    /**
     * Check if a host is alive using ping
     */
    private function isHostAlive(string $ip, int $timeout = 1): bool
    {
        try {
            // Windows ping command with very short timeout for web requests
            if (PHP_OS_FAMILY === 'Windows') {
                $command = 'C:\Windows\System32\ping.exe -n 1 -w '.($timeout * 500)." {$ip}"; // Even shorter timeout
                $result = Process::timeout(2)->run($command); // Shorter process timeout

                Log::debug("Ping command: {$command}");
                Log::debug("Ping result for {$ip}: exit code {$result->exitCode()}, output: ".substr($result->output(), 0, 200));

                // Check for specific success indicators in Windows ping output
                $output = $result->output();
                $isAlive = $result->successful() && (
                    str_contains($output, 'Reply from '.$ip) ||
                    (str_contains($output, 'bytes=') && ! str_contains($output, 'Destination host unreachable') && ! str_contains($output, 'Request timed out'))
                );

                Log::debug("Host {$ip} alive check: ".($isAlive ? 'YES' : 'NO'));

                return $isAlive;
            } else {
                // Unix/Linux ping command
                $result = Process::timeout(3)->run("ping -c 1 -W {$timeout} {$ip}");

                return $result->successful();
            }
        } catch (\Exception $e) {
            Log::warning("Ping failed for {$ip}: ".$e->getMessage());

            return false;
        }
    }

    /**
     * Get hostname for an IP address
     */
    private function getHostname(string $ip): ?string
    {
        try {
            $hostname = gethostbyaddr($ip);

            return $hostname !== $ip ? $hostname : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get MAC address for an IP (requires ARP table)
     */
    private function getMacAddress(string $ip): ?string
    {
        try {
            if (PHP_OS_FAMILY === 'Windows') {
                $result = Process::timeout(3)->run("arp -a {$ip}");
                if ($result->successful()) {
                    // Parse Windows ARP output
                    if (preg_match('/([0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2})/i', $result->output(), $matches)) {
                        return str_replace('-', ':', $matches[1]);
                    }
                }
            } else {
                $result = Process::timeout(3)->run("arp -n {$ip}");
                if ($result->successful()) {
                    // Parse Unix ARP output
                    if (preg_match('/([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})/i', $result->output(), $matches)) {
                        return $matches[1];
                    }
                }
            }
        } catch (\Exception $e) {
            Log::debug("MAC address lookup failed for {$ip}: ".$e->getMessage());
        }

        return null;
    }

    /**
     * Scan for common services on a host (optimized for speed)
     */
    private function scanServices(string $ip, int $timeout = 3): array
    {
        $services = [];

        // Reduced set of most common ports for faster scanning
        $commonPorts = [
            22 => 'SSH',
            80 => 'HTTP',
            443 => 'HTTPS',
            3389 => 'RDP',
            161 => 'SNMP',
            21 => 'FTP',
            23 => 'Telnet',
            25 => 'SMTP',
        ];

        // Use shorter timeout for each port to prevent overall timeout
        $portTimeout = min($timeout / count($commonPorts), 1); // Max 1 second per port

        foreach ($commonPorts as $port => $serviceName) {
            if ($this->isPortOpen($ip, $port, $portTimeout)) {
                $services[] = [
                    'name' => $serviceName,
                    'port' => $port,
                    'protocol' => 'tcp',
                ];
            }
        }

        return $services;
    }

    /**
     * Check if a specific port is open (optimized version)
     */
    private function isPortOpen(string $ip, int $port, float $timeout = 1): bool
    {
        try {
            $startTime = microtime(true);
            $connection = @fsockopen($ip, $port, $errno, $errstr, $timeout);

            if ($connection) {
                fclose($connection);

                return true;
            }

            // Early timeout check
            if ((microtime(true) - $startTime) > $timeout) {
                return false;
            }
        } catch (\Exception $e) {
            // Port is closed or filtered
        }

        return false;
    }

    /**
     * Attempt to detect operating system
     */
    private function detectOS(string $ip): ?string
    {
        try {
            // Try to get OS info via nmap if available
            $result = Process::timeout(10)->run("nmap -O --osscan-limit {$ip}");
            if ($result->successful() && str_contains($result->output(), 'OS details:')) {
                if (preg_match('/OS details: (.+)/', $result->output(), $matches)) {
                    return trim($matches[1]);
                }
            }
        } catch (\Exception $e) {
            // Nmap not available or failed
        }

        // Fallback: try TTL-based detection from ping
        try {
            if (PHP_OS_FAMILY === 'Windows') {
                $result = Process::timeout(3)->run("C:\Windows\System32\ping.exe -n 1 {$ip}");
            } else {
                $result = Process::timeout(3)->run("ping -c 1 {$ip}");
            }

            if ($result->successful() && preg_match('/ttl=(\d+)/i', $result->output(), $matches)) {
                $ttl = (int) $matches[1];

                // Common TTL values
                if ($ttl <= 64) {
                    return 'Linux/Unix';
                } elseif ($ttl <= 128) {
                    return 'Windows';
                } elseif ($ttl <= 255) {
                    return 'Network Device';
                }
            }
        } catch (\Exception $e) {
            // OS detection failed
        }

        return null;
    }

    /**
     * Parse subnet notation into array of IP addresses
     */
    public function parseSubnet(string $subnet): array
    {
        if (! str_contains($subnet, '/')) {
            // Single IP
            return [$subnet];
        }

        [$network, $prefixLength] = explode('/', $subnet);
        $prefixLength = (int) $prefixLength;

        $ip = ip2long($network);
        $netmask = ~((1 << (32 - $prefixLength)) - 1);
        $networkAddress = $ip & $netmask;
        $broadcastAddress = $networkAddress | ~$netmask;

        $ips = [];
        // Skip network and broadcast addresses for /24 and smaller networks
        $start = $prefixLength >= 24 ? $networkAddress + 1 : $networkAddress;
        $end = $prefixLength >= 24 ? $broadcastAddress - 1 : $broadcastAddress;

        for ($i = $start; $i <= $end; $i++) {
            $ips[] = long2ip($i);
        }

        return $ips;
    }

    /**
     * Discover hosts via ARP table scanning (more reliable than ping)
     */
    private function discoverHostsViaARP(string $subnet): array
    {
        $hosts = [];

        try {
            // Extract network portion for filtering
            $networkFilter = $this->getNetworkFilterForARP($subnet);

            // Get filtered ARP table entries for better performance
            $arpEntries = $this->getFilteredARPTable($networkFilter);
            Log::debug('ARP discovery: Found '.count($arpEntries)." total ARP entries for network filter: {$networkFilter}");

            // Filter entries that match the exact subnet (the ARP filter is broader)
            $subnetHosts = $this->filterARPEntriesBySubnet($arpEntries, $subnet);
            Log::debug("ARP discovery: After filtering for subnet {$subnet}, found ".count($subnetHosts).' matching entries', [
                'subnet' => $subnet,
                'total_arp_entries' => count($arpEntries),
                'filtered_entries' => $subnetHosts,
            ]);

            Log::info('Found '.count($subnetHosts)." hosts via ARP for subnet {$subnet}");

            // Convert ARP entries to host info
            foreach ($subnetHosts as $arpEntry) {
                $hostInfo = [
                    'ip' => $arpEntry['ip'],
                    'mac' => $arpEntry['mac'],
                    'hostname' => $this->getHostname($arpEntry['ip']),
                    'discovery_method' => 'ARP',
                    'arp_type' => $arpEntry['type'] ?? 'dynamic',
                    'services' => [], // Will be populated later if detailed scanning is enabled
                    'discovered_at' => now()->toISOString(),
                ];

                $hosts[] = $hostInfo;
            }

        } catch (\Exception $e) {
            Log::warning('ARP discovery failed: '.$e->getMessage());
        }

        return $hosts;
    }

    /**
     * Get the system's ARP table
     */
    private function getARPTable(): array
    {
        $arpEntries = [];

        try {
            if (PHP_OS_FAMILY === 'Windows') {
                Log::debug('Getting ARP table on Windows');
                // Use full path to arp command since web server may not have System32 in PATH
                $arpCommand = 'C:\Windows\System32\arp.exe -a';
                $result = Process::timeout(10)->run($arpCommand);
                Log::debug('ARP command result', [
                    'command' => $arpCommand,
                    'successful' => $result->successful(),
                    'exit_code' => $result->exitCode(),
                    'output_length' => strlen($result->output()),
                    'error_output' => $result->errorOutput(),
                    'first_100_chars' => substr($result->output(), 0, 100),
                ]);

                if ($result->successful()) {
                    $arpEntries = $this->parseWindowsARPOutput($result->output());
                } else {
                    Log::error('ARP command failed', [
                        'command' => $arpCommand,
                        'exit_code' => $result->exitCode(),
                        'error_output' => $result->errorOutput(),
                    ]);
                }
            } else {
                $result = Process::timeout(10)->run('arp -a');
                if ($result->successful()) {
                    $arpEntries = $this->parseUnixARPOutput($result->output());
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to get ARP table: '.$e->getMessage());
        }

        Log::debug('getARPTable returning '.count($arpEntries).' entries');

        return $arpEntries;
    }

    /**
     * Get filtered ARP table entries for a specific network
     */
    private function getFilteredARPTable(string $networkFilter): array
    {
        $arpEntries = [];

        try {
            if (PHP_OS_FAMILY === 'Windows') {
                Log::debug("Getting filtered ARP table on Windows for network: {$networkFilter}");
                // Use findstr to filter ARP results for better performance
                $arpCommand = "C:\\Windows\\System32\\arp.exe -a | findstr {$networkFilter}";
                $result = Process::timeout(5)->run($arpCommand);
                Log::debug('Filtered ARP command result', [
                    'command' => $arpCommand,
                    'successful' => $result->successful(),
                    'exit_code' => $result->exitCode(),
                    'output_length' => strlen($result->output()),
                    'error_output' => $result->errorOutput(),
                    'output' => $result->output(),
                ]);

                if ($result->successful()) {
                    $arpEntries = $this->parseWindowsARPOutput($result->output());
                } else {
                    Log::error('Filtered ARP command failed', [
                        'command' => $arpCommand,
                        'exit_code' => $result->exitCode(),
                        'error_output' => $result->errorOutput(),
                    ]);
                }
            } else {
                // For Unix systems, use grep
                $result = Process::timeout(5)->run("arp -a | grep {$networkFilter}");
                if ($result->successful()) {
                    $arpEntries = $this->parseUnixARPOutput($result->output());
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to get filtered ARP table: '.$e->getMessage());
        }

        Log::debug('getFilteredARPTable returning '.count($arpEntries).' entries');

        return $arpEntries;
    }

    /**
     * Extract network portion for ARP filtering (e.g., "192.168.142" from "192.168.142.0/24")
     */
    private function getNetworkFilterForARP(string $subnet): string
    {
        if (! str_contains($subnet, '/')) {
            // Single IP, extract first 3 octets
            $parts = explode('.', $subnet);

            return implode('.', array_slice($parts, 0, 3));
        }

        [$network, $prefixLength] = explode('/', $subnet);
        $prefixLength = (int) $prefixLength;

        // For /24 networks, use first 3 octets
        if ($prefixLength >= 24) {
            $parts = explode('.', $network);

            return implode('.', array_slice($parts, 0, 3));
        }

        // For larger networks, still use first 3 octets as a reasonable filter
        // This might include some extra entries but it's better than scanning everything
        $parts = explode('.', $network);

        return implode('.', array_slice($parts, 0, 3));
    }

    /**
     * Parse Windows ARP command output
     */
    private function parseWindowsARPOutput(string $output): array
    {
        $entries = [];
        $lines = explode("\n", $output);

        Log::debug('Parsing Windows ARP output, total lines: '.count($lines));

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            // Match lines like: 192.168.1.1    00-11-22-33-44-55     dynamic
            // More flexible regex to handle varying whitespace and case
            if (preg_match('/(\d+\.\d+\.\d+\.\d+)\s+([0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2})\s+(\w+)/i', $line, $matches)) {
                $entry = [
                    'ip' => $matches[1],
                    'mac' => str_replace('-', ':', strtolower($matches[2])),
                    'type' => strtolower($matches[3]),
                ];
                $entries[] = $entry;

                // Debug log entries in our target subnet
                if (str_starts_with($matches[1], '192.168.142.')) {
                    Log::debug('ARP Parse: Found target subnet entry', [
                        'raw_line' => $line,
                        'parsed_entry' => $entry,
                    ]);
                }
            } else {
                // Log lines that don't match to see if we're missing something
                if (str_contains($line, '192.168.142.')) {
                    Log::debug('ARP Parse: Failed to match target line', ['line' => $line]);
                }
            }
        }

        Log::debug('ARP Parse: Total entries parsed: '.count($entries));

        return $entries;
    }

    /**
     * Parse Unix/Linux ARP command output
     */
    private function parseUnixARPOutput(string $output): array
    {
        $entries = [];
        $lines = explode("\n", $output);

        foreach ($lines as $line) {
            $line = trim($line);
            // Match lines like: 192.168.1.1 (192.168.1.1) at 00:11:22:33:44:55 [ether] on eth0
            if (preg_match('/(\d+\.\d+\.\d+\.\d+).*?([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})/i', $line, $matches)) {
                $entries[] = [
                    'ip' => $matches[1],
                    'mac' => strtolower($matches[2]),
                    'type' => 'dynamic',
                ];
            }
        }

        return $entries;
    }

    /**
     * Filter ARP entries to only include those in the specified subnet
     */
    private function filterARPEntriesBySubnet(array $arpEntries, string $subnet): array
    {
        if (! str_contains($subnet, '/')) {
            // Single IP, return if it matches
            return array_filter($arpEntries, function ($entry) use ($subnet) {
                return $entry['ip'] === $subnet;
            });
        }

        [$network, $prefixLength] = explode('/', $subnet);
        $prefixLength = (int) $prefixLength;

        $networkLong = ip2long($network);
        $netmask = ~((1 << (32 - $prefixLength)) - 1);
        $networkAddress = $networkLong & $netmask;

        return array_filter($arpEntries, function ($entry) use ($networkAddress, $netmask) {
            $entryLong = ip2long($entry['ip']);

            return ($entryLong & $netmask) === $networkAddress;
        });
    }

    /**
     * Merge host data from different discovery methods
     */
    private function mergeHostData(array $existing, array $new): array
    {
        // Start with existing data
        $merged = $existing;

        // Update fields from new data if they're better/more complete
        if (isset($new['mac']) && ! isset($existing['mac'])) {
            $merged['mac'] = $new['mac'];
        }

        if (isset($new['hostname']) && ! isset($existing['hostname'])) {
            $merged['hostname'] = $new['hostname'];
        }

        if (isset($new['services']) && ! empty($new['services'])) {
            $merged['services'] = array_merge($existing['services'] ?? [], $new['services']);
        }

        // Combine discovery methods
        $existingMethods = explode(', ', $existing['discovery_method'] ?? '');
        $newMethods = explode(', ', $new['discovery_method'] ?? '');
        $allMethods = array_unique(array_merge($existingMethods, $newMethods));
        $merged['discovery_method'] = implode(', ', $allMethods);

        return $merged;
    }

    /**
     * Get the local machine's IP addresses
     */
    public function getLocalIPs(): array
    {
        $localIPs = [];

        try {
            if (PHP_OS_FAMILY === 'Windows') {
                $result = Process::timeout(5)->run('ipconfig');
                if ($result->successful()) {
                    preg_match_all('/IPv4 Address[.\s]*: ([\d.]+)/', $result->output(), $matches);
                    $localIPs = $matches[1] ?? [];
                }
            } else {
                $result = Process::timeout(5)->run('hostname -I');
                if ($result->successful()) {
                    $localIPs = array_filter(explode(' ', trim($result->output())));
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to get local IPs: '.$e->getMessage());
        }

        return array_filter($localIPs, function ($ip) {
            return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4);
        });
    }

    /**
     * Detect the local subnet automatically
     */
    public function detectLocalSubnet(): ?string
    {
        $localIPs = $this->getLocalIPs();

        foreach ($localIPs as $ip) {
            // Skip loopback
            if (str_starts_with($ip, '127.')) {
                continue;
            }

            // Assume /24 for common private networks
            if (str_starts_with($ip, '192.168.') ||
                str_starts_with($ip, '10.') ||
                preg_match('/^172\.(1[6-9]|2[0-9]|3[01])\./', $ip)) {

                $parts = explode('.', $ip);
                $parts[3] = '0';

                return implode('.', $parts).'/24';
            }
        }

        return null;
    }

    /**
     * Populate ARP table by pinging a subset of IPs in the subnet
     * This helps discover devices that might not be in the ARP table
     */
    private function populateARPTable(string $subnet): void
    {
        $ipRange = $this->parseSubnet($subnet);

        // For large subnets, we need to sample across the entire range
        // Use reasonable limits with progress feedback
        $totalIPs = count($ipRange);
        $maxSample = min(25, $totalIPs); // Increased back to 25 with progress

        if ($totalIPs <= $maxSample) {
            // Small subnet, ping everything
            $sampleIPs = $ipRange;
        } else {
            // Large subnet, sample evenly across the range
            $step = intval($totalIPs / $maxSample);
            $sampleIPs = [];
            for ($i = 0; $i < $totalIPs; $i += $step) {
                if (count($sampleIPs) >= $maxSample) {
                    break;
                }
                $sampleIPs[] = $ipRange[$i];
            }
        }

        Log::debug('Populating ARP table by pinging '.count($sampleIPs)." IPs sampled from {$totalIPs} total IPs in subnet {$subnet}");

        // Use reasonable chunks with progress feedback
        $chunks = array_chunk($sampleIPs, 5); // Back to 5 IPs per chunk
        foreach ($chunks as $chunk) {
            $this->pingChunkForARP($chunk);
        }

        // Smaller delay
        usleep(200000); // Reduced from 0.5 to 0.2 seconds
    }

    /**
     * Ping a chunk of IPs with very short timeout to populate ARP table
     */
    private function pingChunkForARP(array $ips): void
    {
        foreach ($ips as $ip) {
            // Very quick ping just to get the device into ARP table
            // Use full path for Windows and very short timeout to avoid timeouts
            $command = PHP_OS_FAMILY === 'Windows'
                ? "C:\\Windows\\System32\\ping.exe -n 1 -w 300 {$ip}" // Reduced from 500ms to 300ms
                : "ping -c 1 -W 0.3 {$ip}"; // 300ms timeout for Unix too
            $process = Process::timeout(2)->run($command);
            // We don't care about the result, just want to populate ARP
        }
    }
}

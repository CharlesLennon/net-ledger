<?php

namespace App\Services\Scanners;

class ArpScanner extends BaseScanner
{
    /**
     * Get the name of this scanner
     */
    public function getScannerName(): string
    {
        return 'arp';
    }

    /**
     * Check if ARP scanning is available on the current system
     */
    public function isAvailable(): bool
    {
        $command = PHP_OS_FAMILY === 'Windows' ? 'C:\Windows\System32\arp.exe -?' : 'which arp';
        $result = $this->executeCommand($command, 2);

        return $result['success'];
    }

    /**
     * Scan subnet using ARP table analysis
     */
    public function scanSubnet(string $subnet): ScanResult
    {
        $startTime = microtime(true);
        $this->logScannerActivity("Starting ARP scan for subnet: {$subnet}");
        $this->reportProgress('Starting', 'Initializing ARP scan');

        $result = new ScanResult([], $subnet);
        $result->setScanMethods([$this->getScannerName()]);

        // Get network prefix for filtering
        $networkPrefix = $this->getNetworkPrefix($subnet);

        // Step 1: Populate ARP table by pinging strategic IPs
        $this->populateArpTable($subnet);

        // Step 2: Read and parse ARP table
        $this->reportProgress('Reading ARP', 'Analyzing ARP table');
        $arpEntries = $this->getFilteredArpTable($networkPrefix);

        // Step 3: Process ARP entries into host data
        $this->reportProgress('Processing', 'Converting ARP entries to hosts');
        $foundHosts = 0;

        foreach ($arpEntries as $entry) {
            if ($this->isValidIP($entry['ip'])) {
                $hostData = $this->createHostData($entry['ip'], [
                    'mac' => $entry['mac'],
                    'vendor' => $this->getMacVendor($entry['mac']),
                    'alive' => true, // If in ARP table, it's recently been active
                    'arp_type' => $entry['type'] ?? 'unknown',
                ]);

                $result->push($hostData);
                $foundHosts++;

                $this->reportProgress('Found Host', $entry['ip'], [
                    'found_count' => $foundHosts,
                    'mac' => $entry['mac'],
                ]);
            }
        }

        $scanDuration = microtime(true) - $startTime;
        $result->setScanDuration($scanDuration);
        $result->setMetadata([
            'arp_entries_total' => count($arpEntries),
            'network_prefix' => $networkPrefix,
            'scan_method' => 'arp_table_analysis',
        ]);

        $this->logScannerActivity('ARP scan completed', [
            'subnet' => $subnet,
            'hosts_found' => $foundHosts,
            'duration' => $scanDuration,
            'arp_entries' => count($arpEntries),
        ]);

        $this->reportProgress('Completed', '', [
            'hosts_found' => $foundHosts,
            'duration' => $scanDuration,
        ]);

        return $result;
    }

    /**
     * Populate ARP table by pinging strategic IPs
     */
    private function populateArpTable(string $subnet): void
    {
        $this->reportProgress('Populating ARP', 'Sending discovery pings');

        $ipRange = $this->parseSubnet($subnet);
        $sampleSize = min(15, count($ipRange)); // Sample up to 15 IPs

        // Sample IPs across the range for better coverage
        $sampleIPs = [];
        if (count($ipRange) <= $sampleSize) {
            $sampleIPs = $ipRange;
        } else {
            $step = intval(count($ipRange) / $sampleSize);
            for ($i = 0; $i < count($ipRange); $i += $step) {
                if (count($sampleIPs) >= $sampleSize) {
                    break;
                }
                $sampleIPs[] = $ipRange[$i];
            }
        }

        $this->logScannerActivity("Populating ARP table with {$sampleSize} ping samples");

        // Send quick pings to populate ARP table
        foreach ($sampleIPs as $ip) {
            $this->reportProgress('Pinging', $ip);
            $this->quickPing($ip);
        }

        // Small delay to let ARP table update
        usleep(100000); // 0.1 seconds
    }

    /**
     * Send a quick ping to populate ARP table
     */
    private function quickPing(string $ip): void
    {
        if (PHP_OS_FAMILY === 'Windows') {
            $command = "C:\\Windows\\System32\\ping.exe -n 1 -w 300 {$ip}";
        } else {
            $command = "ping -c 1 -W 1 {$ip}";
        }

        // We don't care about the result, just want to populate ARP
        $this->executeCommand($command, 2);
    }

    /**
     * Get filtered ARP table entries for the target network
     */
    private function getFilteredArpTable(string $networkPrefix): array
    {
        $this->reportProgress('Reading ARP', 'Fetching ARP table');

        if (PHP_OS_FAMILY === 'Windows') {
            return $this->getWindowsArpTable($networkPrefix);
        } else {
            return $this->getUnixArpTable($networkPrefix);
        }
    }

    /**
     * Get ARP table on Windows systems
     */
    private function getWindowsArpTable(string $networkPrefix): array
    {
        // Use findstr to filter results for better performance
        $command = "C:\\Windows\\System32\\arp.exe -a | findstr {$networkPrefix}";
        $result = $this->executeCommand($command, 10);

        if (! $result['success']) {
            $this->logScannerActivity('Windows ARP command failed', [
                'command' => $command,
                'error' => $result['error'],
            ]);

            return [];
        }

        return $this->parseWindowsArpOutput($result['output']);
    }

    /**
     * Get ARP table on Unix/Linux systems
     */
    private function getUnixArpTable(string $networkPrefix): array
    {
        $command = "arp -a | grep {$networkPrefix}";
        $result = $this->executeCommand($command, 10);

        if (! $result['success']) {
            $this->logScannerActivity('Unix ARP command failed', [
                'command' => $command,
                'error' => $result['error'],
            ]);

            return [];
        }

        return $this->parseUnixArpOutput($result['output']);
    }

    /**
     * Parse Windows ARP command output
     */
    private function parseWindowsArpOutput(string $output): array
    {
        $entries = [];
        $lines = explode("\n", trim($output));

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            // Windows ARP format: IP Address       Physical Address      Type
            // Example: 192.168.1.1      aa-bb-cc-dd-ee-ff     dynamic
            if (preg_match('/(\d+\.\d+\.\d+\.\d+)\s+([a-fA-F0-9-]{17})\s+(\w+)/', $line, $matches)) {
                $entries[] = [
                    'ip' => $matches[1],
                    'mac' => str_replace('-', ':', strtolower($matches[2])),
                    'type' => strtolower($matches[3]),
                ];
            }
        }

        $this->logScannerActivity('Parsed Windows ARP output', [
            'lines_processed' => count($lines),
            'entries_found' => count($entries),
        ]);

        return $entries;
    }

    /**
     * Parse Unix/Linux ARP command output
     */
    private function parseUnixArpOutput(string $output): array
    {
        $entries = [];
        $lines = explode("\n", trim($output));

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            // Unix ARP format variations:
            // host.domain (192.168.1.1) at aa:bb:cc:dd:ee:ff [ether] on eth0
            if (preg_match('/\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([a-fA-F0-9:]{17})/', $line, $matches)) {
                $entries[] = [
                    'ip' => $matches[1],
                    'mac' => strtolower($matches[2]),
                    'type' => 'dynamic',
                ];
            }
        }

        $this->logScannerActivity('Parsed Unix ARP output', [
            'lines_processed' => count($lines),
            'entries_found' => count($entries),
        ]);

        return $entries;
    }

    /**
     * Get MAC address vendor information
     */
    private function getMacVendor(string $mac): ?string
    {
        // Extract OUI (first 3 octets) for vendor lookup
        $oui = strtoupper(str_replace(':', '', substr($mac, 0, 8)));

        // Common vendor mappings (you could expand this or use an external service)
        $vendors = [
            'D8BBC1' => 'QNAP Systems',
            '001B63' => 'Apple',
            '00904C' => 'Epson',
            '001E58' => 'Apple',
            'B827EB' => 'Raspberry Pi Foundation',
            'DCA6B4' => 'Apple',
            'F45C89' => 'Apple',
            '98F4AB' => 'Apple',
            'A4C361' => 'Apple',
            'BC2411' => 'Apple',
            '000000' => 'Unknown',
        ];

        return $vendors[$oui] ?? null;
    }
}

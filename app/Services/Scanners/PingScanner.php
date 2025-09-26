<?php

namespace App\Services\Scanners;

class PingScanner extends BaseScanner
{
    /**
     * Get the name of this scanner
     */
    public function getScannerName(): string
    {
        return 'ping';
    }

    /**
     * Check if ping scanning is available on the current system
     */
    public function isAvailable(): bool
    {
        $command = PHP_OS_FAMILY === 'Windows' ? 'C:\Windows\System32\ping.exe -?' : 'which ping';
        $result = $this->executeCommand($command, 2);

        return $result['success'];
    }

    /**
     * Scan subnet using ICMP ping
     */
    public function scanSubnet(string $subnet): ScanResult
    {
        $startTime = microtime(true);
        $this->logScannerActivity("Starting ping scan for subnet: {$subnet}");
        $this->reportProgress('Starting', 'Initializing ping scan');

        $result = new ScanResult([], $subnet);
        $result->setScanMethods([$this->getScannerName()]);

        $ipRange = $this->parseSubnet($subnet);
        $maxIPs = $this->config['max_ips'] ?? 50;

        if (count($ipRange) > $maxIPs) {
            $this->logScannerActivity('Limiting scan from '.count($ipRange)." to {$maxIPs} IPs");
            $ipRange = array_slice($ipRange, 0, $maxIPs);
        }

        $foundHosts = 0;
        $scannedCount = 0;
        $totalIPs = count($ipRange);

        // Process IPs in chunks for better performance
        $chunkSize = $this->config['chunk_size'] ?? 10;
        $chunks = array_chunk($ipRange, $chunkSize);

        foreach ($chunks as $chunkIndex => $chunk) {
            $this->reportProgress('Ping Sweep', 'Chunk '.($chunkIndex + 1).'/'.count($chunks));

            foreach ($chunk as $ip) {
                $scannedCount++;
                $this->reportProgress('Pinging', $ip, [
                    'scanned' => $scannedCount,
                    'total' => $totalIPs,
                    'found' => $foundHosts,
                ]);

                if ($this->pingHost($ip)) {
                    $hostData = $this->createHostData($ip, [
                        'alive' => true,
                        'response_time' => $this->getLastPingTime(),
                    ]);

                    // Try to get additional information
                    $hostData['hostname'] = $this->getHostname($ip);
                    $hostData['mac'] = $this->getMacAddress($ip);

                    if ($hostData['mac']) {
                        $hostData['vendor'] = $this->getMacVendor($hostData['mac']);
                    }

                    $result->push($hostData);
                    $foundHosts++;

                    $this->reportProgress('Host Found', $ip, [
                        'found_count' => $foundHosts,
                    ]);
                }
            }

            // Small delay between chunks to avoid overwhelming the network
            if ($chunkIndex < count($chunks) - 1) {
                usleep(50000); // 0.05 seconds
            }
        }

        $scanDuration = microtime(true) - $startTime;
        $result->setScanDuration($scanDuration);
        $result->setMetadata([
            'total_ips_scanned' => $scannedCount,
            'chunk_size' => $chunkSize,
            'scan_method' => 'icmp_ping',
        ]);

        $this->logScannerActivity('Ping scan completed', [
            'subnet' => $subnet,
            'hosts_found' => $foundHosts,
            'ips_scanned' => $scannedCount,
            'duration' => $scanDuration,
        ]);

        $this->reportProgress('Completed', '', [
            'hosts_found' => $foundHosts,
            'duration' => $scanDuration,
        ]);

        return $result;
    }

    /**
     * Ping a single host
     */
    private function pingHost(string $ip): bool
    {
        if (PHP_OS_FAMILY === 'Windows') {
            $command = 'C:\\Windows\\System32\\ping.exe -n 1 -w '.($this->timeout * 1000)." {$ip}";
        } else {
            $command = "ping -c 1 -W {$this->timeout} {$ip}";
        }

        $result = $this->executeCommand($command, $this->timeout + 1);

        if (! $result['success']) {
            return false;
        }

        // Check for specific success indicators
        $output = $result['output'];

        if (PHP_OS_FAMILY === 'Windows') {
            return str_contains($output, 'Reply from '.$ip) ||
                   (str_contains($output, 'bytes=') &&
                    ! str_contains($output, 'Destination host unreachable') &&
                    ! str_contains($output, 'Request timed out'));
        } else {
            return str_contains($output, '1 received') ||
                   str_contains($output, '1 packets transmitted, 1 received');
        }
    }

    /**
     * Get response time from last ping (placeholder)
     */
    private function getLastPingTime(): ?float
    {
        // This could be enhanced to extract actual response time from ping output
        return null;
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
     * Get MAC address for an IP (from ARP table)
     */
    private function getMacAddress(string $ip): ?string
    {
        if (PHP_OS_FAMILY === 'Windows') {
            $command = "C:\\Windows\\System32\\arp.exe -a {$ip}";
        } else {
            $command = "arp -n {$ip}";
        }

        $result = $this->executeCommand($command, 3);

        if (! $result['success']) {
            return null;
        }

        // Parse MAC address from ARP output
        if (PHP_OS_FAMILY === 'Windows') {
            if (preg_match('/([0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2}-[0-9a-f]{2})/i', $result['output'], $matches)) {
                return str_replace('-', ':', strtolower($matches[1]));
            }
        } else {
            if (preg_match('/([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})/i', $result['output'], $matches)) {
                return strtolower($matches[1]);
            }
        }

        return null;
    }

    /**
     * Get MAC address vendor (basic implementation)
     */
    private function getMacVendor(string $mac): ?string
    {
        // Extract OUI (first 3 octets) for vendor lookup
        $oui = strtoupper(str_replace(':', '', substr($mac, 0, 8)));

        // Common vendor mappings
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
        ];

        return $vendors[$oui] ?? null;
    }
}

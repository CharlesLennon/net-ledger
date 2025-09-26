<?php

namespace App\Services\Scanners;

use Illuminate\Support\Facades\Log;

class PortScanner extends BaseScanner
{
    public function getName(): string
    {
        return 'port';
    }

    public function getScannerName(): string
    {
        return 'port';
    }

    public function scanSubnet(string $subnet): ScanResult
    {
        // Port scanning doesn't scan subnets directly,
        // it scans specific hosts, so this returns empty result
        $this->logScannerActivity("Port scanner doesn't support subnet scanning directly");

        return new ScanResult;
    }

    public function isAvailable(): bool
    {
        // Port scanning is always available (uses PHP sockets)
        return true;
    }

    /**
     * Scan ports on a single host
     */
    public function scanHost(string $ip, array $ports = []): array
    {
        if (empty($ports)) {
            $ports = $this->getCommonPorts();
        }

        $this->logScannerActivity("Starting port scan for host: {$ip}");
        $this->reportProgress('Starting', 'Initializing port scan');

        $openPorts = [];
        $totalPorts = count($ports);
        $scannedPorts = 0;

        foreach ($ports as $port) {
            $scannedPorts++;
            $this->reportProgress('Port Scanning', "Port {$port}", [
                'scanned' => $scannedPorts,
                'total' => $totalPorts,
                'current_port' => $port,
            ]);

            try {
                if ($this->isPortOpen($ip, $port)) {
                    $service = $this->detectService($ip, $port);
                    $openPorts[] = [
                        'port' => $port,
                        'protocol' => 'tcp',
                        'service' => $service['name'] ?? 'unknown',
                        'version' => $service['version'] ?? null,
                        'banner' => $service['banner'] ?? null,
                        'state' => 'open',
                    ];

                    Log::info("Open port found: {$ip}:{$port} ({$service['name']})");
                }
            } catch (\Exception $e) {
                Log::debug("Port scan error for {$ip}:{$port}: ".$e->getMessage());
            }
        }

        $this->logScannerActivity('Port scan completed', [
            'host' => $ip,
            'ports_scanned' => $totalPorts,
            'open_ports' => count($openPorts),
        ]);

        return $openPorts;
    }

    /**
     * Check if a port is open
     */
    private function isPortOpen(string $ip, int $port): bool
    {
        $timeout = min($this->timeout, 5); // Max 5 seconds per port

        $socket = @fsockopen($ip, $port, $errno, $errstr, $timeout);

        if ($socket) {
            fclose($socket);

            return true;
        }

        return false;
    }

    /**
     * Detect service running on a port
     */
    private function detectService(string $ip, int $port): array
    {
        $service = [
            'name' => $this->getServiceName($port),
            'version' => null,
            'banner' => null,
        ];

        try {
            // Try to get service banner
            $banner = $this->getBanner($ip, $port);
            if ($banner) {
                $service['banner'] = $banner;
                $service = array_merge($service, $this->parseServiceFromBanner($banner, $port));
            }
        } catch (\Exception $e) {
            Log::debug("Banner detection failed for {$ip}:{$port}: ".$e->getMessage());
        }

        return $service;
    }

    /**
     * Get service banner
     */
    private function getBanner(string $ip, int $port): ?string
    {
        $timeout = 3;
        $socket = @fsockopen($ip, $port, $errno, $errstr, $timeout);

        if (! $socket) {
            return null;
        }

        // For HTTP services, send an HTTP request
        if (in_array($port, [80, 8080, 8000, 8081, 8008, 8888])) {
            fwrite($socket, "GET / HTTP/1.1\r\nHost: {$ip}\r\nConnection: close\r\n\r\n");
        } elseif (in_array($port, [443, 8443])) {
            // For HTTPS, we can't easily get banner without SSL context
            fclose($socket);

            return 'HTTPS service';
        } elseif ($port === 22) {
            // SSH typically sends banner immediately
        } elseif ($port === 21) {
            // FTP sends welcome message
        } else {
            // For other services, try sending a generic probe
            fwrite($socket, "\r\n");
        }

        // Read response
        $banner = '';
        $start = time();
        while (! feof($socket) && (time() - $start) < 3) {
            $data = fread($socket, 1024);
            if ($data === false) {
                break;
            }
            $banner .= $data;
            if (strlen($banner) > 2048) {
                break;
            } // Limit banner size
        }

        fclose($socket);

        return trim($banner) ?: null;
    }

    /**
     * Parse service information from banner
     */
    private function parseServiceFromBanner(string $banner, int $port): array
    {
        $service = [];

        // HTTP detection
        if (preg_match('/HTTP\/[\d.]+\s+\d+/i', $banner)) {
            $service['name'] = 'http';

            // Server detection
            if (preg_match('/Server:\s*([^\r\n]+)/i', $banner, $matches)) {
                $service['version'] = trim($matches[1]);
            }
        }
        // SSH detection
        elseif (preg_match('/SSH-[\d.]+-([^\r\n]+)/i', $banner, $matches)) {
            $service['name'] = 'ssh';
            $service['version'] = trim($matches[1]);
        }
        // FTP detection
        elseif (preg_match('/220[\s-]([^\r\n]+)/i', $banner, $matches)) {
            $service['name'] = 'ftp';
            $service['version'] = trim($matches[1]);
        }
        // SMTP detection
        elseif (preg_match('/220[\s-]([^\r\n]+).*SMTP/i', $banner, $matches)) {
            $service['name'] = 'smtp';
            $service['version'] = trim($matches[1]);
        }

        return $service;
    }

    /**
     * Get common service name for port
     */
    private function timeout(int $port): string
    {
        $services = [
            21 => 'ftp',
            22 => 'ssh',
            23 => 'telnet',
            25 => 'smtp',
            53 => 'dns',
            80 => 'http',
            110 => 'pop3',
            143 => 'imap',
            443 => 'https',
            993 => 'imaps',
            995 => 'pop3s',
            1433 => 'mssql',
            3306 => 'mysql',
            3389 => 'rdp',
            5432 => 'postgresql',
            8000 => 'http-alt',
            8080 => 'http-proxy',
            8443 => 'https-alt',
            27017 => 'mongodb',
        ];

        return $services[$port] ?? 'unknown';
    }

    /**
     * Get list of common ports to scan
     */
    public function getCommonPorts(): array
    {
        return [
            21,    // FTP
            22,    // SSH
            23,    // Telnet
            25,    // SMTP
            53,    // DNS
            80,    // HTTP
            110,   // POP3
            143,   // IMAP
            443,   // HTTPS
            993,   // IMAPS
            995,   // POP3S
            1433,  // MSSQL
            3306,  // MySQL
            3389,  // RDP
            5432,  // PostgreSQL
            8000,  // HTTP Alt
            8080,  // HTTP Proxy
            8443,  // HTTPS Alt
            27017, // MongoDB
        ];
    }

    /**
     * Get extended port list for thorough scanning
     */
    public function getExtendedPorts(): array
    {
        return array_merge($this->getCommonPorts(), [
            20, 69, 135, 139, 445, 587, 636, 989, 990,
            1723, 2049, 2121, 2525, 3000, 3001, 4443,
            5000, 5001, 5432, 5984, 6379, 7000, 7001,
            8001, 8008, 8081, 8888, 9000, 9001, 9999,
        ]);
    }

    /**
     * Parse ports from string (comma-separated)
     */
    public function parsePorts(string $portString): array
    {
        $ports = [];
        $parts = explode(',', $portString);

        foreach ($parts as $part) {
            $part = trim($part);

            // Handle port ranges (e.g., "80-85")
            if (strpos($part, '-') !== false) {
                [$start, $end] = explode('-', $part, 2);
                $start = (int) trim($start);
                $end = (int) trim($end);

                for ($i = $start; $i <= $end && $i <= 65535; $i++) {
                    $ports[] = $i;
                }
            } else {
                $port = (int) $part;
                if ($port > 0 && $port <= 65535) {
                    $ports[] = $port;
                }
            }
        }

        return array_unique($ports);
    }
}

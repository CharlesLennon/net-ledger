<?php

namespace App\Services\Scanners;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

abstract class BaseScanner
{
    protected $progressCallback = null;

    protected int $timeout = 5;

    protected array $config = [];

    public function __construct(int $timeout = 5, array $config = [])
    {
        $this->timeout = $timeout;
        $this->config = $config;
    }

    /**
     * Set a progress callback function
     */
    public function setProgressCallback(?callable $callback = null): self
    {
        $this->progressCallback = $callback;

        return $this;
    }

    /**
     * Call the progress callback if set
     */
    protected function reportProgress(string $phase, string $currentTarget = '', array $data = []): void
    {
        if ($this->progressCallback) {
            call_user_func($this->progressCallback, $this->getScannerName(), $phase, $currentTarget, $data);
        }
    }

    /**
     * Set timeout for operations
     */
    public function setTimeout(int $timeout): self
    {
        $this->timeout = $timeout;

        return $this;
    }

    /**
     * Get the timeout value
     */
    public function getTimeout(): int
    {
        return $this->timeout;
    }

    /**
     * Set configuration options
     */
    public function setConfig(array $config): self
    {
        $this->config = array_merge($this->config, $config);

        return $this;
    }

    /**
     * Get configuration
     */
    public function getConfig(): array
    {
        return $this->config;
    }

    /**
     * Main scanning method that must be implemented by subclasses
     */
    abstract public function scanSubnet(string $subnet): ScanResult;

    /**
     * Get the name of this scanner
     */
    abstract public function getScannerName(): string;

    /**
     * Check if this scanner is available on the current system
     */
    abstract public function isAvailable(): bool;

    /**
     * Parse a subnet string into an array of IP addresses
     */
    protected function parseSubnet(string $subnet): array
    {
        if (str_contains($subnet, '/')) {
            [$network, $cidr] = explode('/', $subnet);
            $cidr = (int)$cidr;
            $start = ip2long($network);
            $mask = $cidr === 0 ? 0 : (~0 << (32 - $cidr));
            $networkLong = $start & $mask;
            $broadcastLong = $networkLong | (~$mask & 0xFFFFFFFF);
            $ips = [];
            // Skip network and broadcast addresses for subnets larger than /31
            $first = $networkLong + 1;
            $last = $broadcastLong - 1;
            // For /31 and /32, include all addresses (RFC 3021)
            if ($cidr >= 31) {
                $first = $networkLong;
                $last = $broadcastLong;
            }
            for ($ip = $first; $ip <= $last; $ip++) {
                $ips[] = long2ip($ip);
            }
            return $ips;
        } else {
            // Single IP address
            return [$subnet];
        }
    }

    /**
     * Execute a system command with timeout
     */
    protected function executeCommand(string $command, ?int $timeoutSeconds = null): array
    {
        $timeout = $timeoutSeconds ?? $this->timeout;

        try {
            $result = Process::timeout($timeout)->run($command);

            return [
                'success' => $result->successful(),
                'output' => $result->output(),
                'error' => $result->errorOutput(),
                'exit_code' => $result->exitCode(),
            ];
        } catch (\Exception $e) {
            Log::warning("Command execution failed: {$command}", [
                'error' => $e->getMessage(),
                'scanner' => $this->getScannerName(),
            ]);

            return [
                'success' => false,
                'output' => '',
                'error' => $e->getMessage(),
                'exit_code' => -1,
            ];
        }
    }

    /**
     * Create a standardized host data structure
     */
    protected function createHostData(string $ip, array $additionalData = []): array
    {
        return array_merge([
            'ip' => $ip,
            'hostname' => null,
            'mac' => null,
            'vendor' => null,
            'os' => null,
            'alive' => false,
            'services' => [],
            'discovery_methods' => [$this->getScannerName()],
            'scan_timestamp' => now()->toISOString(),
        ], $additionalData);
    }

    /**
     * Validate IP address format
     */
    protected function isValidIP(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false;
    }

    /**
     * Get the network portion of an IP for filtering
     */
    protected function getNetworkPrefix(string $subnet): string
    {
        if (str_contains($subnet, '/')) {
            $subnet = explode('/', $subnet)[0];
        }

        $parts = explode('.', $subnet);

        return implode('.', array_slice($parts, 0, 3));
    }

    /**
     * Log scanner activity
     */
    protected function logScannerActivity(string $message, array $context = []): void
    {
        Log::info("[{$this->getScannerName()}] {$message}", $context);
    }
}

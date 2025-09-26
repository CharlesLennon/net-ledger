<?php

namespace App\Services\Scanners;

use Illuminate\Support\Collection;

class ScanResult extends Collection
{
    protected string $subnet;

    protected array $metadata = [];

    protected float $scanDuration = 0;

    protected array $scanMethods = [];

    public function __construct($items = [], string $subnet = '', array $metadata = [])
    {
        parent::__construct($items);
        $this->subnet = $subnet;
        $this->metadata = $metadata;
    }

    /**
     * Set the subnet that was scanned
     */
    public function setSubnet(string $subnet): self
    {
        $this->subnet = $subnet;

        return $this;
    }

    /**
     * Get the subnet that was scanned
     */
    public function getSubnet(): string
    {
        return $this->subnet;
    }

    /**
     * Set scan metadata
     */
    public function setMetadata(array $metadata): self
    {
        $this->metadata = array_merge($this->metadata, $metadata);

        return $this;
    }

    /**
     * Get scan metadata
     */
    public function getMetadata(): array
    {
        return $this->metadata;
    }

    /**
     * Set scan duration
     */
    public function setScanDuration(float $duration): self
    {
        $this->scanDuration = $duration;

        return $this;
    }

    /**
     * Get scan duration
     */
    public function getScanDuration(): float
    {
        return $this->scanDuration;
    }

    /**
     * Set scan methods used
     */
    public function setScanMethods(array $methods): self
    {
        $this->scanMethods = $methods;

        return $this;
    }

    /**
     * Get scan methods used
     */
    public function getScanMethods(): array
    {
        return $this->scanMethods;
    }

    /**
     * Get hosts that responded to ping
     */
    public function getAliveHosts(): Collection
    {
        return $this->filter(fn ($host) => $host['alive'] ?? false);
    }

    /**
     * Get hosts by discovery method
     */
    public function getHostsByMethod(string $method): Collection
    {
        return $this->filter(fn ($host) => in_array($method, $host['discovery_methods'] ?? []));
    }

    /**
     * Get unique IP addresses found
     */
    public function getIpAddresses(): Collection
    {
        return $this->pluck('ip')->unique();
    }

    /**
     * Get hosts with MAC addresses
     */
    public function getHostsWithMac(): Collection
    {
        return $this->filter(fn ($host) => ! empty($host['mac']));
    }

    /**
     * Merge another ScanResult into this one
     */
    public function mergeScanResult(ScanResult $other): self
    {
        // Merge items by IP address to avoid duplicates
        $existingIPs = $this->pluck('ip')->toArray();

        foreach ($other as $host) {
            if (! in_array($host['ip'], $existingIPs)) {
                $this->push($host);
            } else {
                // Merge data for existing IP
                $existingIndex = $this->search(fn ($item) => $item['ip'] === $host['ip']);
                if ($existingIndex !== false) {
                    $existing = $this->items[$existingIndex];
                    $this->items[$existingIndex] = $this->mergeHostData($existing, $host);
                }
            }
        }

        // Merge metadata
        $this->metadata = array_merge($this->metadata, $other->getMetadata());
        $this->scanMethods = array_unique(array_merge($this->scanMethods, $other->getScanMethods()));

        return $this;
    }

    /**
     * Merge host data from different discovery methods
     */
    private function mergeHostData(array $existing, array $new): array
    {
        $merged = $existing;

        // Merge discovery methods
        $existingMethods = $existing['discovery_methods'] ?? [];
        $newMethods = $new['discovery_methods'] ?? [];
        $merged['discovery_methods'] = array_unique(array_merge($existingMethods, $newMethods));

        // Keep the most complete data
        foreach (['hostname', 'mac', 'vendor', 'os'] as $field) {
            if (empty($merged[$field]) && ! empty($new[$field])) {
                $merged[$field] = $new[$field];
            }
        }

        // Merge services
        if (isset($new['services'])) {
            $merged['services'] = array_merge($merged['services'] ?? [], $new['services']);
        }

        // Keep alive status true if either scan found it alive
        $merged['alive'] = ($existing['alive'] ?? false) || ($new['alive'] ?? false);

        return $merged;
    }

    /**
     * Convert to array for API responses
     */
    public function toScanArray(): array
    {
        return [
            'subnet' => $this->subnet,
            'scan_duration' => $this->scanDuration,
            'scan_methods' => $this->scanMethods,
            'metadata' => $this->metadata,
            'hosts_found' => $this->count(),
            'alive_hosts' => $this->getAliveHosts()->count(),
            'hosts' => $this->toArray(),
        ];
    }
}

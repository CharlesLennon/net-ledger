<?php

namespace App\Jobs;

use App\Models\Device;
use App\Models\History;
use App\Models\IPAddress;
use App\Models\Location;
use App\Models\Service;
use App\Services\NetworkDiscoveryService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessNetworkScan implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private string $subnet = '192.168.1.0/24',
        private int $timeout = 5,
        private bool $dryRun = false
    ) {}

    /**
     * Execute the job.
     */
    public function handle(NetworkDiscoveryService $discoveryService): void
    {
        Log::info('Starting background network scan', [
            'subnet' => $this->subnet,
            'timeout' => $this->timeout,
            'dry_run' => $this->dryRun,
        ]);

        try {
            $discoveredHosts = $discoveryService->scanSubnet($this->subnet, $this->timeout);

            $stats = [
                'hosts_found' => count($discoveredHosts),
                'new_devices' => 0,
                'updated_devices' => 0,
                'new_services' => 0,
            ];

            foreach ($discoveredHosts as $host) {
                $result = $this->processHost($host);

                if ($result['isNew']) {
                    $stats['new_devices']++;
                } elseif ($result['wasUpdated']) {
                    $stats['updated_devices']++;
                }

                $stats['new_services'] += $result['newServices'];
            }

            Log::info('Background network scan completed', $stats);

        } catch (\Exception $e) {
            Log::error('Background network scan failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    private function processHost(array $host): array
    {
        $isNew = false;
        $wasUpdated = false;
        $newServices = 0;

        try {
            // Process IP address
            $ipAddress = IPAddress::where('ip_address', $host['ip'])->first();
            if (! $ipAddress && ! $this->dryRun) {
                $ipAddress = IPAddress::create(['ip_address' => $host['ip']]);
            }

            // Process device
            $device = null;
            if (isset($host['hostname'])) {
                $device = Device::where('model_name', 'like', "%{$host['hostname']}%")->first();
            }

            if (! $device && ! $this->dryRun) {
                $device = Device::create([
                    'serial_number' => $host['mac'] ?? 'AUTO-'.uniqid(),
                    'model_name' => $host['hostname'] ?? 'Unknown Device',
                    'location_id' => $this->getDefaultLocationId(),
                ]);
                $isNew = true;

                History::create([
                    'entity_type' => 'Device',
                    'entity_id' => $device->serial_number,
                    'attribute_changed' => 'created',
                    'old_value' => null,
                    'new_value' => 'Auto-discovered via background scan',
                    'timestamp' => now(),
                ]);
            }

            // Associate IP with device
            if ($device && $ipAddress && ! $this->dryRun) {
                $device->ipAddresses()->syncWithoutDetaching([$ipAddress->ip_address_id]);
            }

            // Process services
            if (isset($host['services'])) {
                foreach ($host['services'] as $serviceData) {
                    $service = Service::where('name', $serviceData['name'])->first();
                    if (! $service && ! $this->dryRun) {
                        $service = Service::create(['name' => $serviceData['name']]);
                        $newServices++;
                    }

                    if ($service && $ipAddress && ! $this->dryRun) {
                        $service->ipAddresses()->syncWithoutDetaching([
                            $ipAddress->ip_address_id => ['port_number' => $serviceData['port']],
                        ]);
                    }
                }
            }

        } catch (\Exception $e) {
            Log::warning('Failed to process host in background scan', [
                'host' => $host,
                'error' => $e->getMessage(),
            ]);
        }

        return [
            'isNew' => $isNew,
            'wasUpdated' => $wasUpdated,
            'newServices' => $newServices,
        ];
    }

    private function getDefaultLocationId(): ?int
    {
        $location = Location::firstOrCreate(['name' => 'Auto-Discovered Devices']);

        return $location->location_id;
    }
}

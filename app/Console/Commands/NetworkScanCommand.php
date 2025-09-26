<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Models\History;
use App\Models\IPAddress;
use App\Models\Location;
use App\Models\Service;
use App\Services\NetworkDiscoveryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class NetworkScanCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'network:scan {--subnet=192.168.1.0/24 : The subnet to scan} {--timeout=5 : Timeout for each host in seconds} {--dry-run : Run without making database changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically scan the network for devices and update the inventory';

    protected NetworkDiscoveryService $discoveryService;

    public function __construct(NetworkDiscoveryService $discoveryService)
    {
        parent::__construct();
        $this->discoveryService = $discoveryService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Starting network discovery scan...');

        $subnet = $this->option('subnet');
        $timeout = (int) $this->option('timeout');
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('⚠️  Running in DRY RUN mode - no database changes will be made');
        }

        $this->info("📡 Scanning subnet: {$subnet}");
        $this->info("⏱️  Timeout per host: {$timeout}s");

        try {
            // Discover hosts on the network
            $discoveredHosts = $this->discoveryService->scanSubnet($subnet, $timeout);

            if (empty($discoveredHosts)) {
                $this->warn('No hosts discovered on the network');

                return self::SUCCESS;
            }

            $this->info('🎯 Found '.count($discoveredHosts).' hosts');

            // Create progress bar
            $bar = $this->output->createProgressBar(count($discoveredHosts));
            $bar->start();

            $newDevices = 0;
            $updatedDevices = 0;
            $newServices = 0;

            foreach ($discoveredHosts as $host) {
                $bar->advance();

                // Process each discovered host
                $result = $this->processDiscoveredHost($host, $dryRun);

                if ($result['isNew']) {
                    $newDevices++;
                } elseif ($result['wasUpdated']) {
                    $updatedDevices++;
                }

                $newServices += $result['newServices'];

                // Small delay to prevent overwhelming the network
                usleep(100000); // 0.1 second
            }

            $bar->finish();
            $this->newLine(2);

            // Display summary
            $this->info('📊 Scan Summary:');
            $this->table([
                'Metric', 'Count',
            ], [
                ['New Devices', $newDevices],
                ['Updated Devices', $updatedDevices],
                ['New Services', $newServices],
                ['Total Hosts Scanned', count($discoveredHosts)],
            ]);

            Log::info('Network scan completed', [
                'subnet' => $subnet,
                'hosts_found' => count($discoveredHosts),
                'new_devices' => $newDevices,
                'updated_devices' => $updatedDevices,
                'new_services' => $newServices,
                'dry_run' => $dryRun,
            ]);

            $this->info('✅ Network scan completed successfully');

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Network scan failed: '.$e->getMessage());
            Log::error('Network scan failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return self::FAILURE;
        }
    }

    private function processDiscoveredHost(array $host, bool $dryRun): array
    {
        $isNew = false;
        $wasUpdated = false;
        $newServices = 0;

        try {
            // Check if IP address exists
            $ipAddress = IPAddress::where('ip_address', $host['ip'])->first();
            if (! $ipAddress && ! $dryRun) {
                $ipAddress = IPAddress::create([
                    'ip_address' => $host['ip'],
                ]);
            }

            // Try to find existing device by hostname or MAC address
            $device = null;
            if (isset($host['hostname'])) {
                $device = Device::where('model_name', 'like', "%{$host['hostname']}%")->first();
            }

            if (! $device && ! $dryRun) {
                // Create new device
                $device = Device::create([
                    'serial_number' => $host['mac'] ?? 'AUTO-'.uniqid(),
                    'model_name' => $host['hostname'] ?? 'Unknown Device',
                    'location_id' => $this->getDefaultLocationId(),
                ]);
                $isNew = true;

                // Log the creation
                History::create([
                    'entity_type' => 'Device',
                    'entity_id' => $device->serial_number,
                    'attribute_changed' => 'created',
                    'old_value' => null,
                    'new_value' => 'Auto-discovered device',
                    'timestamp' => now(),
                ]);
            } elseif ($device) {
                // Update existing device if hostname changed
                if (isset($host['hostname']) && $device->model_name !== $host['hostname']) {
                    if (! $dryRun) {
                        History::create([
                            'entity_type' => 'Device',
                            'entity_id' => $device->serial_number,
                            'attribute_changed' => 'model_name',
                            'old_value' => $device->model_name,
                            'new_value' => $host['hostname'],
                            'timestamp' => now(),
                        ]);

                        $device->update(['model_name' => $host['hostname']]);
                    }
                    $wasUpdated = true;
                }
            }

            // Associate IP with device if both exist
            if ($device && $ipAddress && ! $dryRun) {
                $device->ipAddresses()->syncWithoutDetaching([$ipAddress->ip_address_id]);
            }

            // Process discovered services
            if (isset($host['services'])) {
                foreach ($host['services'] as $serviceData) {
                    $service = Service::where('name', $serviceData['name'])->first();
                    if (! $service && ! $dryRun) {
                        $service = Service::create([
                            'name' => $serviceData['name'],
                        ]);
                        $newServices++;
                    }

                    // Associate service with IP address if both exist
                    if ($service && $ipAddress && ! $dryRun) {
                        $service->ipAddresses()->syncWithoutDetaching([
                            $ipAddress->ip_address_id => ['port_number' => $serviceData['port']],
                        ]);
                    }
                }
            }

        } catch (\Exception $e) {
            Log::warning('Failed to process discovered host', [
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
        // Get or create a default "Auto-Discovered" location
        $location = Location::firstOrCreate([
            'name' => 'Auto-Discovered Devices',
        ]);

        return $location->location_id;
    }
}

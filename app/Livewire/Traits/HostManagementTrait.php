<?php

namespace App\Livewire\Traits;

use Illuminate\Support\Facades\Log;

trait HostManagementTrait
{
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

    public function commitSelectedHosts(): void
    {
        if (empty($this->selectedHosts)) {
            $this->dispatch('commit-failed', 'No hosts selected for commit.');
            return;
        }

        try {
            $selectedHostData = array_intersect_key($this->scanResults, array_flip($this->selectedHosts));

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
            $ipAddress = \App\Models\IPAddress::firstOrCreate([
                'ip_address' => $hostData['ip'],
            ]);

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

                \App\Models\History::create([
                    'entity_type' => 'Device',
                    'entity_id' => $device->serial_number,
                    'attribute_changed' => 'created',
                    'old_value' => null,
                    'new_value' => 'Manual scan discovery',
                    'timestamp' => now(),
                ]);
            }

            $device->ipAddresses()->syncWithoutDetaching([$ipAddress->ip_address_id]);

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
}

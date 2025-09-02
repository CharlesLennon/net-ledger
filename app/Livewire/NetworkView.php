<?php

namespace App\Livewire;

use App\Models\Connection;
use App\Models\Device;
use App\Models\DeviceInterface;
use App\Models\IPAddress;
use App\Models\Location;
use App\Models\NetworkView as NetworkViewModel;
use App\Models\NodePosition;
use App\Models\Service;
use JsonSerializable;
use Livewire\Component;

class NetworkView extends Component implements JsonSerializable
{
    // View-related properties - COMMENTED OUT
    /*
    public $selectedViewId = null;
    public $newViewName = '';
    public $availableViews = [];
    */

    // View-related methods - COMMENTED OUT
    /*
    public function mount()
    {
        $this->loadAvailableViews();
        $this->selectedViewId = $this->getDefaultViewId();
    }

    public function loadAvailableViews()
    {
        $this->availableViews = NetworkViewModel::orderBy('name')->get()->toArray();
    }

    public function getDefaultViewId()
    {
        $defaultView = NetworkViewModel::default()->first();
        return $defaultView ? $defaultView->view_id : null;
    }
    */

    public function saveNodePosition($nodeType, $nodeId, $x, $y)
    {
        $defaultViewId = 1; // Use default view ID since views are temporarily disabled

        try {
            NodePosition::updateOrCreate(
                [
                    'view_id' => $defaultViewId,
                    'node_type' => $nodeType,
                    'node_id' => $nodeId,
                ],
                [
                    'x_position' => $x,
                    'y_position' => $y,
                ]
            );

            return ['success' => true, 'message' => 'Position saved'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to save position: '.$e->getMessage()];
        }
    }

    public function createNewView($name, $description = null)
    {
        if (empty($name)) {
            return ['success' => false, 'message' => 'View name is required'];
        }

        try {
            $view = NetworkViewModel::create([
                'name' => $name,
                'description' => $description,
                'is_default' => false,
            ]);

            $this->loadAvailableViews();
            $this->selectedViewId = $view->view_id;

            return ['success' => true, 'message' => 'View created successfully', 'view_id' => $view->view_id];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to create view: '.$e->getMessage()];
        }
    }

    // View switching methods - COMMENTED OUT
    /*
    public function updatedSelectedViewId($value)
    {
        // Only switch if a valid view ID is selected
        if (!empty($value)) {
            $this->switchView($value);
        }
    }

    public function switchView($viewId)
    {
        $this->selectedViewId = $viewId;

        // Get saved positions for the new view
        $savedPositions = new \stdClass(); // Use object instead of array for empty case
        if ($this->selectedViewId) {
            $positions = NodePosition::where('view_id', $this->selectedViewId)->get();
            $savedPositionsArray = [];
            foreach ($positions as $position) {
                $savedPositionsArray[$position->node_type . '_' . $position->node_id] = [
                    'x' => (float) $position->x_position,
                    'y' => (float) $position->y_position
                ];
            }
            $savedPositions = (object) $savedPositionsArray;
        }

        $this->dispatch('viewSwitched', $viewId, $savedPositions);
    }

    public function createNewView($name, $description = null)
    {
        if (empty($name)) {
            return ['success' => false, 'message' => 'View name is required'];
        }

        try {
            $view = NetworkViewModel::create([
                'name' => $name,
                'description' => $description,
                'is_default' => false,
            ]);

            $this->loadAvailableViews();
            $this->selectedViewId = $view->view_id;

            return ['success' => true, 'message' => 'View created successfully', 'view_id' => $view->view_id];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to create view: ' . $e->getMessage()];
        }
    }

    /*
    public function deleteView($viewId)
    {
        if (!$viewId) {
            return ['success' => false, 'message' => 'Invalid view ID'];
        }

        try {
            $view = NetworkViewModel::find($viewId);
            if (!$view) {
                return ['success' => false, 'message' => 'View not found'];
            }

            if ($view->is_default) {
                return ['success' => false, 'message' => 'Cannot delete default view'];
            }

            $view->delete();
            $this->loadAvailableViews();

            if ($this->selectedViewId === $viewId) {
                $this->selectedViewId = $this->getDefaultViewId();
            }

            return ['success' => true, 'message' => 'View deleted successfully'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to delete view: ' . $e->getMessage()];
        }
    }
    */

    public function render()
    {
        $locations = Location::all()->map(function ($location) {
            return [
                'location_id' => $location->location_id,
                'name' => $location->name,
                'parent_location_id' => $location->parent_location_id,
                'layout_direction' => $location->layout_direction,
            ];
        })->toArray();

        $devices = Device::all()->map(function ($device) {
            return [
                'serial_number' => $device->serial_number,
                'model_name' => $device->model_name,
                'location_id' => $device->location_id,
                'display_name' => $device->model_name.' ('.$device->serial_number.')',
            ];
        })->toArray();

        $services = Service::all()->map(function ($service) {
            return ['service_id' => $service->service_id, 'name' => $service->name];
        })->toArray();

        $connections = Connection::all()->map(function ($connection) {
            return ['connection_id' => $connection->connection_id, 'source_interface_id' => $connection->source_interface_id, 'destination_interface_id' => $connection->destination_interface_id, 'cable_type' => $connection->cable_type];
        })->toArray();

        $ipAddresses = IPAddress::all()->map(function ($ipAddress) {
            return ['ip_address_id' => $ipAddress->ip_address_id, 'ip_address' => $ipAddress->ip_address];
        })->toArray();

        $interfaces = DeviceInterface::with(['device', 'sourceConnections', 'destinationConnections'])->get()->map(function ($interface) {
            return [
                'interface_id' => $interface->interface_id,
                'interface_type' => $interface->interface_type,
                'label' => $interface->label,
                'device_serial_number' => $interface->device_serial_number,
            ];
        })->toArray();

        $pciSlots = \App\Models\PcieSlot::with('device')->get()->map(function ($slot) {
            return [
                'slot_id' => $slot->slot_id,
                'device_serial_number' => $slot->device_serial_number,
                'physical_lane_count' => $slot->physical_lane_count,
                'wired_lane_count' => $slot->wired_lane_count,
            ];
        })->toArray();

        $pciCards = \App\Models\PcieCard::with('pcieSlot.device')->get()->map(function ($card) {
            return [
                'card_serial_number' => $card->card_serial_number,
                'model_name' => $card->model_name,
                'type' => $card->type,
                'slot_id' => $card->slot_id,
                'device_serial_number' => $card->pcieSlot->device_serial_number ?? null,
                'display_name' => $card->model_name.' ('.$card->card_serial_number.')',
            ];
        })->toArray();

        $deviceIPs = \App\Models\Device::with('ipAddresses.services')->get()->map(function ($device) {
            return [
                'device_serial_number' => $device->serial_number,
                'ip_addresses' => $device->ipAddresses->map(function ($ip) {
                    return [
                        'ip_address_id' => $ip->ip_address_id,
                        'ip_address' => $ip->ip_address,
                        'services' => $ip->services->map(function ($service) {
                            return [
                                'service_id' => $service->service_id,
                                'name' => $service->name,
                                'port_number' => $service->pivot->port_number,
                            ];
                        })->toArray(),
                    ];
                })->toArray(),
            ];
        })->toArray();

        // Get saved positions (views temporarily disabled, using default view)
        $savedPositions = [];
        $defaultViewId = 1; // Use a default view ID for now
        $positions = NodePosition::where('view_id', $defaultViewId)->get();
        foreach ($positions as $position) {
            $savedPositions[$position->node_type.'_'.$position->node_id] = [
                'x' => (float) $position->x_position,
                'y' => (float) $position->y_position,
            ];
        }

        return view('livewire.network-view', [
            'locations' => $locations,
            'devices' => $devices,
            'interfaces' => $interfaces,
            'services' => $services,
            'connections' => $connections,
            'ipAddresses' => $ipAddresses,
            'deviceIPs' => $deviceIPs,
            'pciSlots' => $pciSlots,
            'pciCards' => $pciCards,
            'savedPositions' => $savedPositions,
            'availableViews' => [], // Temporarily disabled
            'selectedViewId' => null, // Temporarily disabled
        ]);
    }

    public function jsonSerialize(): array
    {
        return [];
    }
}

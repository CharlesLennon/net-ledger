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
use Livewire\Attributes\On;
use Livewire\Component;
use App\Traits\LocationListeners;
use App\Traits\DeviceListeners;

class NetworkView extends Component implements JsonSerializable
{
    use locationListeners;
    use DeviceListeners;

    public function updateConnection($connectionId, $cableType)
    {

        $connection = Connection::find($connectionId);
        if (! $connection) {
            return ['success' => false, 'message' => 'Connection not found '.$connectionId];
        }

        $connection->cable_type = $cableType;
        $connection->save();

        return ['success' => true, 'message' => 'Connection updated successfully'];

    }

    public function deleteConnection($connectionId)
    {
        $connection = Connection::find($connectionId);
        if (! $connection) {
            return ['success' => false, 'message' => 'Connection not found'];
        }
        $connection->delete();

        return ['success' => true, 'message' => 'Connection deleted successfully'];
    }

    // Event handlers for JavaScript dispatches
    #[On('connection-updated')]
    public function handleConnectionUpdated($connectionId, $cableType)
    {
        $result = $this->updateConnection($connectionId, $cableType);

        // Dispatch response back to JavaScript
        $this->dispatch('connection-update-response', [
            'success' => $result['success'],
            'message' => $result['message'],
            'connectionId' => $connectionId,
        ]);
    }

    #[On('connection-deleted')]
    public function handleConnectionDeleted($connectionId)
    {
        $result = $this->deleteConnection($connectionId);

        // Dispatch response back to JavaScript
        $this->dispatch('connection-delete-response', [
            'success' => $result['success'],
            'message' => $result['message'],
            'connectionId' => $connectionId,
        ]);
    }

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
            'availableViews' => [], // Temporarily disabled
            'selectedViewId' => null, // Temporarily disabled
        ]);
    }

    public function jsonSerialize(): array
    {
        return [];
    }
}

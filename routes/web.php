<?php

use Illuminate\Support\Facades\Route;
use App\Livewire\NetworkView;
use Illuminate\Support\Facades\Artisan;

Route::get('/', NetworkView::class);

Route::get('/network-view', NetworkView::class);

Route::get('/sanity-check', function () {
    return view('sanity-check');
});

Route::get('/test-json', function () {
    $locations = \App\Models\Location::all()->map(function ($location) {
        return [
            'location_id' => $location->location_id, 
            'name' => $location->name,
            'parent_location_id' => $location->parent_location_id
        ];
    })->toArray();

    $devices = \App\Models\Device::all()->map(function ($device) {
        return [
            'serial_number' => $device->serial_number, 
            'model_name' => $device->model_name, 
            'location_id' => $device->location_id,
            'display_name' => $device->model_name . ' (' . $device->serial_number . ')'
        ];
    })->toArray();

    $services = \App\Models\Service::all()->map(function ($service) {
        return ['service_id' => $service->service_id, 'name' => $service->name];
    })->toArray();

    $connections = \App\Models\Connection::all()->map(function ($connection) {
        return ['connection_id' => $connection->connection_id, 'source_interface_id' => $connection->source_interface_id, 'destination_interface_id' => $connection->destination_interface_id, 'cable_type' => $connection->cable_type];
    })->toArray();

    $ipAddresses = \App\Models\IPAddress::all()->map(function ($ipAddress) {
        return ['ip_address_id' => $ipAddress->ip_address_id, 'ip_address' => $ipAddress->ip_address];
    })->toArray();

    $interfaces = \App\Models\DeviceInterface::with(['device', 'sourceConnections', 'destinationConnections'])->get()->map(function ($interface) {
        return [
            'interface_id' => $interface->interface_id,
            'interface_type' => $interface->interface_type,
            'label' => $interface->label,
            'device_serial_number' => $interface->device_serial_number
        ];
    })->toArray();

    $deviceIPs = \App\Models\Device::with('ipAddresses')->get()->map(function ($device) {
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
                            'port_number' => $service->pivot->port_number
                        ];
                    })->toArray()
                ];
            })->toArray()
        ];
    })->toArray();

    return view('test-json', compact('locations', 'devices', 'interfaces', 'connections', 'deviceIPs', 'services'));
});

Route::post('/refresh-db', function () {
    try {
        Artisan::call('migrate:fresh', ['--seed' => true]);
        return response('Database refreshed successfully!', 200);
    } catch (Exception $e) {
        return response('Database refresh failed: ' . $e->getMessage(), 500);
    }
});

// Laravel Boost browser logs route (temporary fix)
Route::post('/_boost/browser-logs', function (Illuminate\Http\Request $request) {
    $logs = $request->input('logs', []);
    foreach ($logs as $log) {
        \Illuminate\Support\Facades\Log::info('Browser: ' . json_encode($log));
    }
    return response()->json(['status' => 'logged']);
})->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

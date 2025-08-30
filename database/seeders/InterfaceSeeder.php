<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\DeviceInterface;
use App\Models\Device;
use App\Models\PcieCard;

class InterfaceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $devices = Device::all();

        foreach ($devices as $device) {
            // All devices get power input
            DeviceInterface::create([
                'interface_type' => 'Power',
                'label' => 'power-in',
                'device_serial_number' => $device->serial_number,
            ]);

            // Device-specific interfaces based on model type
            if (str_contains($device->model_name, 'Catalyst')) {
                // Cisco Catalyst switch - 24 port switch
                for ($i = 1; $i <= 24; $i++) {
                    DeviceInterface::create([
                        'interface_type' => 'RJ45',
                        'label' => "eth{$i}",
                        'device_serial_number' => $device->serial_number,
                    ]);
                }
            } elseif (str_contains($device->model_name, 'Netgear') || str_contains($device->model_name, 'GS724T')) {
                // Netgear switch - 24 port managed switch
                for ($i = 1; $i <= 24; $i++) {
                    DeviceInterface::create([
                        'interface_type' => 'RJ45',
                        'label' => "eth{$i}",
                        'device_serial_number' => $device->serial_number,
                    ]);
                }
            } elseif (str_contains($device->model_name, 'pfSense') || str_contains($device->model_name, 'Firewall')) {
                // Firewall - WAN/LAN interfaces
                DeviceInterface::create([
                    'interface_type' => 'RJ45',
                    'label' => 'wan0',
                    'device_serial_number' => $device->serial_number,
                ]);
                DeviceInterface::create([
                    'interface_type' => 'RJ45',
                    'label' => 'lan0',
                    'device_serial_number' => $device->serial_number,
                ]);
                DeviceInterface::create([
                    'interface_type' => 'RJ45',
                    'label' => 'dmz0',
                    'device_serial_number' => $device->serial_number,
                ]);
            } else {
                // Server/Generic device - standard interfaces
                DeviceInterface::create([
                    'interface_type' => 'RJ45',
                    'label' => 'eth0',
                    'device_serial_number' => $device->serial_number,
                ]);
                DeviceInterface::create([
                    'interface_type' => 'RJ45',
                    'label' => 'eth1',
                    'device_serial_number' => $device->serial_number,
                ]);
                DeviceInterface::create([
                    'interface_type' => 'RJ45',
                    'label' => 'mgmt0',
                    'device_serial_number' => $device->serial_number,
                ]);
            }
        }
    }
}

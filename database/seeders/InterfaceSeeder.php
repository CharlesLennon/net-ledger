<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\DeviceInterface;
use App\Models\PcieCard;
use Illuminate\Database\Seeder;

class InterfaceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $devices = Device::all();

        foreach ($devices as $device) {
            // Device-specific interfaces based on model type
            if (str_contains($device->model_name, 'Catalyst-2960-8')) {
                // Cisco Catalyst switch - 8 port switch + power input
                DeviceInterface::create([
                    'interface_type' => 'Power',
                    'label' => 'power-in',
                    'device_serial_number' => $device->serial_number,
                ]);
                for ($i = 1; $i <= 8; $i++) {
                    DeviceInterface::create([
                        'interface_type' => 'RJ45',
                        'label' => "eth{$i}",
                        'device_serial_number' => $device->serial_number,
                    ]);
                }
            } elseif (str_contains($device->model_name, 'GS708T-300')) {
                // Netgear switch - 8 port managed switch + power input
                DeviceInterface::create([
                    'interface_type' => 'Power',
                    'label' => 'power-in',
                    'device_serial_number' => $device->serial_number,
                ]);
                for ($i = 1; $i <= 8; $i++) {
                    DeviceInterface::create([
                        'interface_type' => 'RJ45',
                        'label' => "eth{$i}",
                        'device_serial_number' => $device->serial_number,
                    ]);
                }
            } elseif (str_contains($device->model_name, 'pfSense') || str_contains($device->model_name, 'Firewall')) {
                // Firewall - WAN/LAN interfaces + power input
                DeviceInterface::create([
                    'interface_type' => 'Power',
                    'label' => 'power-in',
                    'device_serial_number' => $device->serial_number,
                ]);
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
            } elseif (str_contains($device->model_name, 'APC') || str_contains($device->model_name, 'PDU')) {
                // PDU - Power Distribution Unit with multiple power outputs + power input
                for ($i = 1; $i <= 8; $i++) {
                    DeviceInterface::create([
                        'interface_type' => 'Power',
                        'label' => "outlet-{$i}",
                        'device_serial_number' => $device->serial_number,
                    ]);
                }
                // PDU also has a power input
                DeviceInterface::create([
                    'interface_type' => 'Power',
                    'label' => 'power-in',
                    'device_serial_number' => $device->serial_number,
                ]);
            } elseif (str_contains($device->model_name, 'Main-Power-Source')) {
                // Main Power Source - provides power to PDU (no power input needed)
                DeviceInterface::create([
                    'interface_type' => 'Power',
                    'label' => 'main-power-out',
                    'device_serial_number' => $device->serial_number,
                ]);
            } else {
                // Server/Generic device - standard interfaces + power input
                DeviceInterface::create([
                    'interface_type' => 'Power',
                    'label' => 'power-in',
                    'device_serial_number' => $device->serial_number,
                ]);
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

        // Create interfaces for PCI cards
        $pciCards = PcieCard::all();
        foreach ($pciCards as $pciCard) {
            if ($pciCard->type === 'Network') {
                // Network cards get RJ45 interfaces
                for ($i = 1; $i <= 4; $i++) {
                    DeviceInterface::create([
                        'interface_type' => 'RJ45',
                        'label' => "eth{$i}",
                        'device_serial_number' => null, // PCI cards don't belong to devices directly
                        'card_serial_number' => $pciCard->card_serial_number,
                    ]);
                }
            } elseif ($pciCard->type === 'GPU') {
                // GPU cards get display interfaces
                DeviceInterface::create([
                    'interface_type' => 'DisplayPort',
                    'label' => 'dp0',
                    'device_serial_number' => null,
                    'card_serial_number' => $pciCard->card_serial_number,
                ]);
                DeviceInterface::create([
                    'interface_type' => 'HDMI',
                    'label' => 'hdmi0',
                    'device_serial_number' => null,
                    'card_serial_number' => $pciCard->card_serial_number,
                ]);
            }
        }
    }
}

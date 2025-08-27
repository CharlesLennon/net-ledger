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
        DeviceInterface::create([
            'interface_type' => 'RJ45',
            'label' => 'eth0',
            'device_serial_number' => Device::first()->serial_number,
        ]);
        DeviceInterface::create([
            'interface_type' => 'HDMI',
            'label' => 'hdmi1',
            'card_serial_number' => PcieCard::first()->card_serial_number,
            'device_serial_number' => Device::first()->serial_number,
        ]);
    }
}

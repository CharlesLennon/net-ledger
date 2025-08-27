<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Device;
use App\Models\Location;
use App\Models\DeviceTemplate;
use App\Models\PcieSlot;

class DeviceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $template = DeviceTemplate::first();
        $device = Device::create([
            'serial_number' => 'SN12345',
            'model_name' => 'Supermicro-5019D-4C-FN8TP',
            'location_id' => Location::where('name', 'U1')->first()->location_id,
            'template_id' => $template->template_id,
        ]);

        $specs = json_decode($template->specifications_json, true);

        foreach ($specs['pcie_slots'] as $slot) {
            PcieSlot::create([
                'device_serial_number' => $device->serial_number,
                'physical_lane_count' => $slot['physical_lane_count'],
                'wired_lane_count' => $slot['wired_lane_count'],
            ]);
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\PcieSlot;
use App\Models\Device;

class PcieSlotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $devices = Device::all();

        foreach ($devices as $device) {
            PcieSlot::create([
                'device_serial_number' => $device->serial_number,
                'physical_lane_count' => 16,
                'wired_lane_count' => 8,
            ]);
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Device;
use App\Models\Location;
use App\Models\DeviceTemplate;

class DeviceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Device::create([
            'serial_number' => 'SN12345',
            'model_name' => 'Supermicro-5019D-4C-FN8TP',
            'location_id' => Location::where('name', 'U1')->first()->location_id,
            'template_id' => DeviceTemplate::first()->template_id,
        ]);
    }
}

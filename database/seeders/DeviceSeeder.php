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
        $u1 = Location::where('name', 'U1')->first();
        $u2 = Location::where('name', 'U2')->first();
        $u3 = Location::where('name', 'U3')->first();
        $template = DeviceTemplate::first();

        // U1 Device
        Device::create([
            'serial_number' => 'SN12345',
            'model_name' => 'Supermicro-5019D-4C-FN8TP',
            'location_id' => $u1->location_id,
            'template_id' => $template->template_id,
        ]);

        // U2 Devices
        Device::create([
            'serial_number' => 'SW001234',
            'model_name' => 'Cisco-Catalyst-2960',
            'location_id' => $u2->location_id,
            'template_id' => $template->template_id,
        ]);

        Device::create([
            'serial_number' => 'SRV001234',
            'model_name' => 'Dell-PowerEdge-R720',
            'location_id' => $u2->location_id,
            'template_id' => $template->template_id,
        ]);

        Device::create([
            'serial_number' => 'SRV001235',
            'model_name' => 'Dell-PowerEdge-R720',
            'location_id' => $u2->location_id,
            'template_id' => $template->template_id,
        ]);

        Device::create([
            'serial_number' => 'SRV001236',
            'model_name' => 'Dell-PowerEdge-R720',
            'location_id' => $u2->location_id,
            'template_id' => $template->template_id,
        ]);

        Device::create([
            'serial_number' => 'FW001234',
            'model_name' => 'pfSense-SG-3100',
            'location_id' => $u2->location_id,
            'template_id' => $template->template_id,
        ]);

        // U3 Network Switch
        Device::create([
            'serial_number' => 'SW002345',
            'model_name' => 'Netgear-GS724T-400',
            'location_id' => $u3->location_id,
            'template_id' => $template->template_id,
        ]);
    }
}

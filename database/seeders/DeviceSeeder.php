<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\DeviceTemplate;
use App\Models\Location;
use Illuminate\Database\Seeder;

class DeviceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $u1 = Location::where('name', 'like', '%U1%')->first();
        $u2 = Location::where('name', 'like', '%U2%')->first();
        $u3 = Location::where('name', 'like', '%U3%')->first();
        $u4 = Location::where('name', 'like', '%U4%')->first();
        $u5 = Location::where('name', 'like', '%U5%')->first();
        $u6 = Location::where('name', 'like', '%U6%')->first();
        $u7 = Location::where('name', 'like', '%U7%')->first();
        $u8 = Location::where('name', 'like', '%U8%')->first();
        $template = DeviceTemplate::first();

        // U1 Supermicro Server
        Device::create([
            'serial_number' => 'SN12345',
            'model_name' => 'Supermicro-5019D-4C-FN8TP',
            'location_id' => $u1->location_id,
            'template_id' => $template->template_id,
        ]);

        // U2 Cisco Switch (reduced to 8 ports)
        Device::create([
            'serial_number' => 'SW001234',
            'model_name' => 'Cisco-Catalyst-2960-8',
            'location_id' => $u2->location_id,
            'template_id' => $template->template_id,
        ]);

        // U3 Dell Server 1
        Device::create([
            'serial_number' => 'SRV001234',
            'model_name' => 'Dell-PowerEdge-R720',
            'location_id' => $u3->location_id,
            'template_id' => $template->template_id,
        ]);

        // U4 Dell Server 2
        Device::create([
            'serial_number' => 'SRV001235',
            'model_name' => 'Dell-PowerEdge-R720',
            'location_id' => $u4->location_id,
            'template_id' => $template->template_id,
        ]);

        // U5 Dell Server 3
        Device::create([
            'serial_number' => 'SRV001236',
            'model_name' => 'Dell-PowerEdge-R720',
            'location_id' => $u5->location_id,
            'template_id' => $template->template_id,
        ]);

        // U6 pfSense Firewall
        Device::create([
            'serial_number' => 'FW001234',
            'model_name' => 'pfSense-SG-3100',
            'location_id' => $u6->location_id,
            'template_id' => $template->template_id,
        ]);

        // U7 Netgear Switch (reduced to 8 ports)
        Device::create([
            'serial_number' => 'SW002345',
            'model_name' => 'Netgear-GS708T-300',
            'location_id' => $u7->location_id,
            'template_id' => $template->template_id,
        ]);

        // U8 APC PDU
        Device::create([
            'serial_number' => 'PDU001234',
            'model_name' => 'APC-AP7553',
            'location_id' => $u8->location_id,
            'template_id' => $template->template_id,
        ]);

        // Add a Main Power Source (simulated)
        Device::create([
            'serial_number' => 'PWR001234',
            'model_name' => 'Main-Power-Source',
            'location_id' => $u8->location_id, // Same rack unit as PDU
            'template_id' => $template->template_id,
        ]);
    }
}

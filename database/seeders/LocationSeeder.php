<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $room = Location::create(['name' => 'Server Room']);
        $rack = Location::create(['name' => 'Rack 1', 'parent_location_id' => $room->location_id]);
        Location::create(['name' => 'U1 - Supermicro Server', 'parent_location_id' => $rack->location_id]);
        Location::create(['name' => 'U2 - Cisco Switch', 'parent_location_id' => $rack->location_id]);
        Location::create(['name' => 'U3 - Dell Server 1', 'parent_location_id' => $rack->location_id]);
        Location::create(['name' => 'U4 - Dell Server 2', 'parent_location_id' => $rack->location_id]);
        Location::create(['name' => 'U5 - Dell Server 3', 'parent_location_id' => $rack->location_id]);
        Location::create(['name' => 'U6 - pfSense Firewall', 'parent_location_id' => $rack->location_id]);
        Location::create(['name' => 'U7 - Netgear Switch', 'parent_location_id' => $rack->location_id]);
        Location::create(['name' => 'U8 - APC PDU', 'parent_location_id' => $rack->location_id]);
    }
}

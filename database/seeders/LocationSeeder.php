<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Location;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $room = Location::create(['name' => 'Server Room']);
        $rack = Location::create(['name' => 'Rack 1', 'parent_location_id' => $room->location_id]);
        Location::create(['name' => 'U1', 'parent_location_id' => $rack->location_id]);
        Location::create(['name' => 'U2', 'parent_location_id' => $rack->location_id]);
        Location::create(['name' => 'U3', 'parent_location_id' => $rack->location_id]);
    }
}

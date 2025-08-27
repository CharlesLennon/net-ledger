<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Connection;
use App\Models\DeviceInterface;

class ConnectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $interfaces = DeviceInterface::all();
        if ($interfaces->count() >= 2) {
            Connection::create([
                'source_interface_id' => $interfaces[0]->interface_id,
                'destination_interface_id' => $interfaces[1]->interface_id,
                'cable_type' => 'Cat6',
            ]);
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\IPAddress;
use App\Models\Device;
use App\Models\Service;

class IPAddressSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ip = IPAddress::create(['ip_address' => '192.168.1.10']);
        $device = Device::first();
        $ip->devices()->attach($device);

        $ssh = Service::where('name', 'SSH')->first();
        $http = Service::where('name', 'HTTP')->first();

        $ip->services()->attach($ssh, ['port_number' => 22]);
        $ip->services()->attach($http, ['port_number' => 80]);
    }
}

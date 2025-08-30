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
        $devices = Device::all();
        $services = Service::all();

        // Assign IPs to devices
        foreach ($devices as $index => $device) {
            if (str_contains($device->model_name, 'Catalyst')) {
                // Cisco Catalyst switch management IP
                $ip = IPAddress::create(['ip_address' => '192.168.1.10']);
                $ip->devices()->attach($device);
                
                // Attach management services
                $ssh = $services->where('name', 'SSH')->first();
                $telnet = $services->where('name', 'Telnet')->first();
                if ($ssh) $ip->services()->attach($ssh, ['port_number' => 22]);
                if ($telnet) $ip->services()->attach($telnet, ['port_number' => 23]);

            } elseif (str_contains($device->model_name, 'Netgear') || str_contains($device->model_name, 'GS724T')) {
                // Netgear switch management IP
                $ip = IPAddress::create(['ip_address' => '192.168.1.20']);
                $ip->devices()->attach($device);
                
                // Attach web management services
                $ssh = $services->where('name', 'SSH')->first();
                $http = $services->where('name', 'HTTP')->first();
                $https = $services->where('name', 'HTTPS')->first();
                if ($ssh) $ip->services()->attach($ssh, ['port_number' => 22]);
                if ($http) $ip->services()->attach($http, ['port_number' => 80]);
                if ($https) $ip->services()->attach($https, ['port_number' => 443]);

            } elseif (str_contains($device->model_name, 'pfSense') || str_contains($device->model_name, 'Firewall')) {
                // Firewall interfaces
                $wanIp = IPAddress::create(['ip_address' => '203.0.113.1']);
                $lanIp = IPAddress::create(['ip_address' => '192.168.1.1']);
                $dmzIp = IPAddress::create(['ip_address' => '10.0.0.1']);
                
                $wanIp->devices()->attach($device);
                $lanIp->devices()->attach($device);
                $dmzIp->devices()->attach($device);

                // Attach firewall services
                $ssh = $services->where('name', 'SSH')->first();
                $https = $services->where('name', 'HTTPS')->first();
                if ($ssh) $lanIp->services()->attach($ssh, ['port_number' => 22]);
                if ($https) $lanIp->services()->attach($https, ['port_number' => 443]);

            } else {
                // Servers - multiple IPs with various services
                $baseOctet = 20 + ($index * 10);
                
                // Primary IP
                $primaryIp = IPAddress::create(['ip_address' => "192.168.1.{$baseOctet}"]);
                $primaryIp->devices()->attach($device);
                
                // Secondary IP
                $secondaryIp = IPAddress::create(['ip_address' => "192.168.1." . ($baseOctet + 1)]);
                $secondaryIp->devices()->attach($device);

                // Management IP
                $mgmtIp = IPAddress::create(['ip_address' => "10.0.1.{$baseOctet}"]);
                $mgmtIp->devices()->attach($device);

                // Assign services to IPs
                $ssh = $services->where('name', 'SSH')->first();
                $http = $services->where('name', 'HTTP')->first();
                $https = $services->where('name', 'HTTPS')->first();
                $mysql = $services->where('name', 'MySQL')->first();
                $redis = $services->where('name', 'Redis')->first();

                if ($ssh) {
                    $primaryIp->services()->attach($ssh, ['port_number' => 22]);
                    $mgmtIp->services()->attach($ssh, ['port_number' => 22]);
                }
                if ($http) $primaryIp->services()->attach($http, ['port_number' => 80]);
                if ($https) $primaryIp->services()->attach($https, ['port_number' => 443]);
                if ($mysql) $secondaryIp->services()->attach($mysql, ['port_number' => 3306]);
                if ($redis) $secondaryIp->services()->attach($redis, ['port_number' => 6379]);
            }
        }
    }
}

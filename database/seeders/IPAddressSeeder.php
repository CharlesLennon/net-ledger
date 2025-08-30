<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\IPAddress;
use App\Models\Service;
use Illuminate\Database\Seeder;

class IPAddressSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $devices = Device::all();
        $services = Service::all();

        // Assign IPs to devices with limited services (0-2 per device)
        foreach ($devices as $index => $device) {
            if (str_contains($device->model_name, 'Catalyst')) {
                // Cisco Catalyst switch - 1 service
                $ip = IPAddress::create(['ip_address' => '192.168.1.10']);
                $ip->devices()->attach($device);

                // Attach only SSH
                $ssh = $services->where('name', 'SSH')->first();
                if ($ssh) {
                    $ip->services()->attach($ssh, ['port_number' => 22]);
                }

            } elseif (str_contains($device->model_name, 'Netgear') || str_contains($device->model_name, 'GS708T-300')) {
                // Netgear switch - 2 services
                $ip = IPAddress::create(['ip_address' => '192.168.1.20']);
                $ip->devices()->attach($device);

                // Attach SSH and HTTPS
                $ssh = $services->where('name', 'SSH')->first();
                $https = $services->where('name', 'HTTPS')->first();
                if ($ssh) {
                    $ip->services()->attach($ssh, ['port_number' => 22]);
                }
                if ($https) {
                    $ip->services()->attach($https, ['port_number' => 443]);
                }

            } elseif (str_contains($device->model_name, 'pfSense') || str_contains($device->model_name, 'Firewall')) {
                // Firewall - 1 service
                $lanIp = IPAddress::create(['ip_address' => '192.168.1.1']);
                $lanIp->devices()->attach($device);

                // Attach only HTTPS
                $https = $services->where('name', 'HTTPS')->first();
                if ($https) {
                    $lanIp->services()->attach($https, ['port_number' => 443]);
                }

            } elseif (str_contains($device->model_name, 'APC') || str_contains($device->model_name, 'PDU')) {
                // PDU - 0 services (no IP management)
                continue;

            } else {
                // Servers - vary services (0-2 per device)
                $baseOctet = 20 + ($index * 10);

                if ($index % 3 === 0) {
                    // Some servers have no services
                    continue;
                } elseif ($index % 3 === 1) {
                    // Some servers have 1 service
                    $primaryIp = IPAddress::create(['ip_address' => "192.168.1.{$baseOctet}"]);
                    $primaryIp->devices()->attach($device);

                    $ssh = $services->where('name', 'SSH')->first();
                    if ($ssh) {
                        $primaryIp->services()->attach($ssh, ['port_number' => 22]);
                    }
                } else {
                    // Some servers have 2 services
                    $primaryIp = IPAddress::create(['ip_address' => "192.168.1.{$baseOctet}"]);
                    $primaryIp->devices()->attach($device);

                    $ssh = $services->where('name', 'SSH')->first();
                    $https = $services->where('name', 'HTTPS')->first();
                    if ($ssh) {
                        $primaryIp->services()->attach($ssh, ['port_number' => 22]);
                    }
                    if ($https) {
                        $primaryIp->services()->attach($https, ['port_number' => 443]);
                    }
                }
            }
        }
    }
}

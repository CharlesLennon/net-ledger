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
        // Clear existing connections first
        Connection::truncate();
        
        // Get all interfaces organized by device
        $devices = \App\Models\Device::with('interfaces')->get();
        
        // Find devices for connections
        $ciscoSwitch = $devices->where('model_name', 'like', '%Catalyst%')->first();
        $netgearSwitch = $devices->where('model_name', 'like', '%Netgear%')->first();
        $firewall = $devices->where('model_name', 'like', '%pfSense%')->first();
        $servers = $devices->where('model_name', 'like', '%PowerEdge%');
        $supermicro = $devices->where('model_name', 'like', '%Supermicro%')->first();

        echo "Creating enhanced switch-based network topology...\n";
        
        // Connect firewall to Cisco switch (LAN interface to switch port 1)
        if ($ciscoSwitch && $firewall) {
            $firewallLan = $firewall->interfaces->where('label', 'lan0')->first();
            $switchPort1 = $ciscoSwitch->interfaces->where('label', 'eth1')->first();
            
            if ($firewallLan && $switchPort1) {
                Connection::create([
                    'source_interface_id' => $firewallLan->interface_id,
                    'destination_interface_id' => $switchPort1->interface_id,
                    'cable_type' => 'Cat6',
                ]);
                echo "✓ Connected Firewall LAN to Cisco Switch Port 1\n";
            }
        }

        // Connect switches together (inter-switch link)
        if ($ciscoSwitch && $netgearSwitch) {
            $ciscoUplink = $ciscoSwitch->interfaces->where('label', 'eth24')->first(); // Use last port as uplink
            $netgearUplink = $netgearSwitch->interfaces->where('label', 'eth1')->first();
            
            if ($ciscoUplink && $netgearUplink) {
                Connection::create([
                    'source_interface_id' => $ciscoUplink->interface_id,
                    'destination_interface_id' => $netgearUplink->interface_id,
                    'cable_type' => 'Cat6',
                ]);
                echo "✓ Connected Cisco Switch to Netgear Switch (inter-switch link)\n";
            }
        }

        // Connect servers to Cisco switch (primary interfaces)
        if ($ciscoSwitch && $servers->count() > 0) {
            $portNumber = 2; // Start from port 2 (port 1 is for firewall)
            
            foreach ($servers as $server) {
                $serverEth0 = $server->interfaces->where('label', 'eth0')->first();
                $switchPort = $ciscoSwitch->interfaces->where('label', "eth{$portNumber}")->first();
                
                if ($serverEth0 && $switchPort && $portNumber <= 23) { // Leave port 24 for uplink
                    Connection::create([
                        'source_interface_id' => $serverEth0->interface_id,
                        'destination_interface_id' => $switchPort->interface_id,
                        'cable_type' => 'Cat6',
                    ]);
                    echo "✓ Connected Server {$server->serial_number} eth0 to Cisco Switch Port {$portNumber}\n";
                    $portNumber++;
                }
            }
        }

        // Connect Supermicro to Netgear switch 
        if ($netgearSwitch && $supermicro) {
            $supermicroEth0 = $supermicro->interfaces->where('label', 'eth0')->first();
            $switchPort = $netgearSwitch->interfaces->where('label', "eth2")->first(); // Port 1 is for uplink
            
            if ($supermicroEth0 && $switchPort) {
                Connection::create([
                    'source_interface_id' => $supermicroEth0->interface_id,
                    'destination_interface_id' => $switchPort->interface_id,
                    'cable_type' => 'Cat6',
                ]);
                echo "✓ Connected Supermicro eth0 to Netgear Switch Port 2\n";
            }
        }

        // Connect Supermicro secondary interface to Netgear switch
        if ($netgearSwitch && $supermicro) {
            $supermicroEth1 = $supermicro->interfaces->where('label', 'eth1')->first();
            $switchPort = $netgearSwitch->interfaces->where('label', "eth3")->first();
            
            if ($supermicroEth1 && $switchPort) {
                Connection::create([
                    'source_interface_id' => $supermicroEth1->interface_id,
                    'destination_interface_id' => $switchPort->interface_id,
                    'cable_type' => 'Cat6',
                ]);
                echo "✓ Connected Supermicro eth1 to Netgear Switch Port 3 (secondary link)\n";
            }
        }

        // Create server-to-server direct connections (secondary interfaces)
        $serversList = $servers->values();
        if ($serversList->count() >= 2) {
            $server1Eth1 = $serversList[0]->interfaces->where('label', 'eth1')->first();
            $server2Eth1 = $serversList[1]->interfaces->where('label', 'eth1')->first();
            
            if ($server1Eth1 && $server2Eth1) {
                Connection::create([
                    'source_interface_id' => $server1Eth1->interface_id,
                    'destination_interface_id' => $server2Eth1->interface_id,
                    'cable_type' => 'Cat6',
                ]);
                echo "✓ Connected Server-to-Server (eth1 crossover)\n";
            }
        }

        // Create additional switch uplink connections if we have more interfaces
        if ($switch && $supermicro) {
            $supermicroEth1 = $supermicro->interfaces->where('label', 'eth1')->first();
            $switchPort = $switch->interfaces->where('label', "eth6")->first();
            
            if ($supermicroEth1 && $switchPort) {
                Connection::create([
                    'source_interface_id' => $supermicroEth1->interface_id,
                    'destination_interface_id' => $switchPort->interface_id,
                    'cable_type' => 'Cat6',
                ]);
                echo "✓ Connected Supermicro eth1 to Switch Port 6 (secondary link)\n";
            }
        }

        $totalConnections = Connection::count();
        echo "Network topology created with {$totalConnections} physical connections.\n";
    }
}

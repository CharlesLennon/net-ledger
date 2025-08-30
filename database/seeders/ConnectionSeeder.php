<?php

namespace Database\Seeders;

use App\Models\Connection;
use Illuminate\Database\Seeder;

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
        $ciscoSwitch = $devices->first(function ($device) {
            return str_contains(strtolower($device->model_name), 'catalyst-2960-8');
        });
        $netgearSwitch = $devices->first(function ($device) {
            return str_contains(strtolower($device->model_name), 'gs708t-300');
        });
        $firewall = $devices->first(function ($device) {
            return str_contains(strtolower($device->model_name), 'pfsense');
        });
        $servers = $devices->filter(function ($device) {
            return str_contains(strtolower($device->model_name), 'poweredge');
        });
        $supermicro = $devices->first(function ($device) {
            return str_contains(strtolower($device->model_name), 'supermicro');
        });
        $pdu = $devices->first(function ($device) {
            return str_contains(strtolower($device->model_name), 'apc') || str_contains(strtolower($device->model_name), 'pdu');
        });
        $mainPower = $devices->first(function ($device) {
            return str_contains(strtolower($device->model_name), 'main-power-source');
        });

        echo "Creating enhanced switch-based network topology with PDU...\n";

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
            $ciscoUplink = $ciscoSwitch->interfaces->where('label', 'eth8')->first(); // Use last port as uplink
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

                if ($serverEth0 && $switchPort && $portNumber <= 7) { // Leave port 8 for uplink
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

        // Connect firewall to Netgear switch as well (redundant connection)
        if ($netgearSwitch && $firewall) {
            $firewallDmz = $firewall->interfaces->where('label', 'dmz0')->first();
            $switchPort = $netgearSwitch->interfaces->where('label', 'eth4')->first();

            if ($firewallDmz && $switchPort) {
                Connection::create([
                    'source_interface_id' => $firewallDmz->interface_id,
                    'destination_interface_id' => $switchPort->interface_id,
                    'cable_type' => 'Cat6',
                ]);
                echo "✓ Connected Firewall DMZ to Netgear Switch Port 4\n";
            }
        }

        // Connect Supermicro to Netgear switch
        if ($netgearSwitch && $supermicro) {
            $supermicroEth0 = $supermicro->interfaces->where('label', 'eth0')->first();
            $switchPort = $netgearSwitch->interfaces->where('label', 'eth2')->first(); // Port 1 is for uplink

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
            $switchPort = $netgearSwitch->interfaces->where('label', 'eth3')->first();

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

        $totalConnections = Connection::count();
        echo "Network topology created with {$totalConnections} physical connections.\n";

        // Create power connections from PDU to all devices
        if ($pdu) {
            echo "\nCreating power distribution connections...\n";

            // First, create a power input connection to the PDU from main power source
            if ($mainPower && $pdu) {
                $mainPowerOutput = $mainPower->interfaces->where('interface_type', 'Power')->where('label', 'main-power-out')->first();
                $pduPowerInput = $pdu->interfaces->where('interface_type', 'Power')->where('label', 'power-in')->first();

                if ($mainPowerOutput && $pduPowerInput) {
                    Connection::create([
                        'source_interface_id' => $mainPowerOutput->interface_id,
                        'destination_interface_id' => $pduPowerInput->interface_id,
                        'cable_type' => 'Power',
                    ]);
                    echo "✓ Connected Main Power Source to PDU power-in\n";
                }
            }

            $outletNumber = 1;

            // Connect PDU to all devices
            foreach ($devices as $device) {
                if ($device->serial_number !== $pdu->serial_number && $device->serial_number !== ($mainPower ? $mainPower->serial_number : '')) {
                    $devicePowerInput = $device->interfaces->where('interface_type', 'Power')->where('label', 'power-in')->first();
                    $pduOutlet = $pdu->interfaces->where('label', "outlet-{$outletNumber}")->first();

                    if ($devicePowerInput && $pduOutlet && $outletNumber <= 8) {
                        Connection::create([
                            'source_interface_id' => $pduOutlet->interface_id,
                            'destination_interface_id' => $devicePowerInput->interface_id,
                            'cable_type' => 'Power',
                        ]);
                        echo "✓ Connected PDU Outlet {$outletNumber} to {$device->model_name} ({$device->serial_number})\n";
                        $outletNumber++;
                    }
                }
            }
        }

        $finalTotal = Connection::count();
        $powerConnections = $finalTotal - $totalConnections;
        echo "\nPower distribution created with {$powerConnections} power connections.\n";
        echo "Total network topology: {$finalTotal} connections (Network: {$totalConnections}, Power: {$powerConnections})\n";
    }
}

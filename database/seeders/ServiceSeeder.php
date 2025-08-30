<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Service;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Service::create(['name' => 'SSH']);
        Service::create(['name' => 'HTTP']);
        Service::create(['name' => 'HTTPS']);
        Service::create(['name' => 'MySQL']);
        Service::create(['name' => 'Redis']);
        Service::create(['name' => 'Telnet']);
        Service::create(['name' => 'SMTP']);
        Service::create(['name' => 'DNS']);
        Service::create(['name' => 'DHCP']);
        Service::create(['name' => 'SNMP']);
        Service::create(['name' => 'FTP']);
        Service::create(['name' => 'Nginx']);
        Service::create(['name' => 'Apache']);
        Service::create(['name' => 'PostgreSQL']);
        Service::create(['name' => 'MongoDB']);
        Service::create(['name' => 'Elasticsearch']);
    }
}

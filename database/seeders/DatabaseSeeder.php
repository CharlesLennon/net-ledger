<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            LocationSeeder::class,
            DeviceTemplateSeeder::class,
            DeviceSeeder::class,
            PcieSlotSeeder::class,
            PcieCardSeeder::class,
            InterfaceSeeder::class,
            ServiceSeeder::class,
            IPAddressSeeder::class,
            ConnectionSeeder::class,
        ]);
    }
}

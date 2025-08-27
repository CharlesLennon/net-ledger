<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\DeviceTemplate;

class DeviceTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DeviceTemplate::create([
            'model_name' => 'Supermicro-5019D-4C-FN8TP',
            'manufacturer' => 'Supermicro',
            'form_factor' => '1U',
            'specifications_json' => json_encode([
                'pcie_slots' => [
                    ['physical_lane_count' => 'x16', 'wired_lane_count' => 'x8']
                ],
                'interfaces' => [
                    ['label' => 'RJ45-1', 'interface_type' => 'RJ45', 'is_onboard' => true],
                    ['label' => 'USB-A', 'interface_type' => 'USB 2.0', 'is_onboard' => true],
                    ['label' => 'VGA', 'interface_type' => 'VGA', 'is_onboard' => true]
                ]
            ])
        ]);
    }
}

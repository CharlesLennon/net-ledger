<?php

namespace Database\Seeders;

use App\Models\NetworkView;
use Illuminate\Database\Seeder;

class NetworkViewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        NetworkView::create([
            'name' => 'Default View',
            'description' => 'Default network visualization layout',
            'is_default' => true,
        ]);

        NetworkView::create([
            'name' => 'Datacenter Layout',
            'description' => 'Optimized layout for datacenter visualization',
            'is_default' => false,
        ]);

        NetworkView::create([
            'name' => 'Logical Topology',
            'description' => 'Focus on logical connections and services',
            'is_default' => false,
        ]);
    }
}

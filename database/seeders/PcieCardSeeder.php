<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\PcieCard;
use App\Models\PcieSlot;

class PcieCardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        PcieCard::create([
            'card_serial_number' => 'PCIE123',
            'model_name' => 'Nvidia RTX 3080',
            'type' => 'GPU',
            'slot_id' => PcieSlot::first()->slot_id,
        ]);
    }
}

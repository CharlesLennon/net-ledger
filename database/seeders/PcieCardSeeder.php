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
        // Get PCI slots for different devices
        $slots = PcieSlot::all();

        PcieCard::updateOrCreate(
            ['card_serial_number' => 'PCIE123'],
            [
                'model_name' => 'Nvidia RTX 3080',
                'type' => 'GPU',
                'slot_id' => $slots->first()->slot_id,
            ]
        );

        if ($slots->count() >= 3) {
            PcieCard::updateOrCreate(
                ['card_serial_number' => 'PCIE456'],
                [
                    'model_name' => 'Intel X710 10GbE',
                    'type' => 'Network',
                    'slot_id' => $slots->skip(2)->first()->slot_id,
                ]
            );
        }

        if ($slots->count() >= 4) {
            PcieCard::updateOrCreate(
                ['card_serial_number' => 'PCIE789'],
                [
                    'model_name' => 'AMD Radeon RX 6800',
                    'type' => 'GPU',
                    'slot_id' => $slots->skip(3)->first()->slot_id,
                ]
            );
        }
    }
}

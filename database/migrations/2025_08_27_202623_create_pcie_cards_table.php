<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pcie_cards', function (Blueprint $table) {
            $table->string('card_serial_number')->primary();
            $table->string('model_name');
            $table->string('type');
            $table->foreignId('slot_id')->nullable()->constrained('pcie_slots', 'slot_id');
            $table->foreignId('location_id')->nullable()->constrained('locations', 'location_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pcie_cards');
    }
};

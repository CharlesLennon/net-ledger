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
        Schema::create('pcie_slots', function (Blueprint $table) {
            $table->id('slot_id');
            $table->foreignId('device_serial_number')->constrained('devices', 'serial_number');
            $table->string('physical_lane_count');
            $table->string('wired_lane_count');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pcie_slots');
    }
};

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
        Schema::create('interfaces', function (Blueprint $table) {
            $table->id('interface_id');
            $table->string('interface_type');
            $table->string('label');
            $table->foreignId('device_serial_number')->constrained('devices', 'serial_number');
            $table->foreignId('card_serial_number')->nullable()->constrained('pcie_cards', 'card_serial_number');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interfaces');
    }
};

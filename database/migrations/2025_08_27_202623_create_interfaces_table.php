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
            $table->foreignId('device_serial_number')->nullable()->constrained('devices', 'serial_number');
            $table->string('card_serial_number')->nullable();
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

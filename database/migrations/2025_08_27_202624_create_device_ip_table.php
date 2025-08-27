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
        Schema::create('device_ip', function (Blueprint $table) {
            $table->foreignId('device_serial_number')->constrained('devices', 'serial_number');
            $table->foreignId('ip_address_id')->constrained('ip_addresses', 'ip_address_id');
            $table->primary(['device_serial_number', 'ip_address_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_ip');
    }
};

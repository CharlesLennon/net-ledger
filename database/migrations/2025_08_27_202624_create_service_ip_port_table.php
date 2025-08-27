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
        Schema::create('service_ip_port', function (Blueprint $table) {
            $table->foreignId('service_id')->constrained('services', 'service_id');
            $table->foreignId('ip_address_id')->constrained('ip_addresses', 'ip_address_id');
            $table->integer('port_number');
            $table->primary(['service_id', 'ip_address_id', 'port_number']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_ip_port');
    }
};

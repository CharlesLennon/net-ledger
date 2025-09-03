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
        Schema::create('node_positions', function (Blueprint $table) {
            $table->id('position_id');
            $table->unsignedBigInteger('view_id');
            $table->string('node_type'); // 'device', 'service', 'pci_card'
            $table->string('node_id'); // serial_number, service_id, or card_serial_number
            $table->decimal('x_position', 10, 2);
            $table->decimal('y_position', 10, 2);
            $table->timestamps();

            $table->foreign('view_id')->references('view_id')->on('network_views')->onDelete('cascade');
            $table->unique(['view_id', 'node_type', 'node_id'], 'unique_view_node_position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('node_positions');
    }
};

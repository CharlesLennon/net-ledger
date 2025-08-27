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
        Schema::create('device_templates', function (Blueprint $table) {
            $table->id('template_id');
            $table->string('model_name');
            $table->string('manufacturer');
            $table->string('form_factor');
            $table->json('specifications_json');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_templates');
    }
};

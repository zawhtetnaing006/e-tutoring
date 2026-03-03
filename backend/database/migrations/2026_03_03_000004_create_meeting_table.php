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
        Schema::create('meeting', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['virtual', 'physical']);
            $table->string('platform')->nullable();
            $table->string('link')->nullable();

            $table->foreignId('class_id')
                ->nullable()
                ->constrained('classRoom')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['class_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting');
    }
};

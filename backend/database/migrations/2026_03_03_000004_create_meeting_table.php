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
            $table->enum('type', ['VIRTUAL', 'PHYSICAL']);
            $table->string('platform')->nullable();
            $table->string('link')->nullable();
            $table->text('location')->nullable();

            $table->foreignId('tutor_assignment_id')
                ->nullable()
                ->constrained('tutor_assignments')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tutor_assignment_id', 'type']);
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

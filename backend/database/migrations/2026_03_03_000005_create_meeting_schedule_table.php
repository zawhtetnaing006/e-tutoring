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
        Schema::create('meeting_schedule', function (Blueprint $table) {
            $table->id();

            $table->foreignId('meeting_id')
                ->nullable()
                ->constrained('meeting')
                ->nullOnDelete();

            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->text('note')->nullable();
            $table->timestamp('cancel_at')->nullable();
            $table->timestamps();

            $table->index(['meeting_id', 'date', 'start_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meeting_schedule');
    }
};

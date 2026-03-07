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
        Schema::create('classRoomFileComments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('class_file_id')
                ->nullable()
                ->constrained('classRoomFiles')
                ->nullOnDelete();

            $table->foreignId('commenter_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('comment_text');
            $table->timestamps();

            $table->index(['class_file_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classRoomFileComments');
    }
};

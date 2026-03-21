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
        Schema::create('blog_comments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('blog_id')
                ->constrained('blogs')
                ->cascadeOnDelete();

            $table->foreignId('commenter_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('comment_text');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['blog_id', 'created_at'], 'blog_comments_blog_id_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blog_comments');
    }
};

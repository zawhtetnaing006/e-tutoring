<?php

namespace Tests\Unit;

use App\Models\Blog;
use App\Models\BlogComment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlogModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_blog_belongs_to_author_and_has_comments(): void
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();

        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Learning Calculus Effectively',
            'content' => 'Practice limits and derivatives daily.',
        ]);

        $comment = BlogComment::query()->create([
            'blog_id' => $blog->id,
            'commenter_user_id' => $commenter->id,
            'comment_text' => 'Thanks for sharing.',
        ]);

        $this->assertSame($author->id, $blog->author?->id);
        $this->assertCount(1, $blog->comments);
        $this->assertSame($comment->id, $blog->comments->first()?->id);
    }

    public function test_blog_comment_belongs_to_blog_and_commenter(): void
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();

        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Time Management for Students',
            'content' => 'Use short study blocks and regular breaks.',
        ]);

        $comment = BlogComment::query()->create([
            'blog_id' => $blog->id,
            'commenter_user_id' => $commenter->id,
            'comment_text' => 'Very useful tips.',
        ]);

        $this->assertSame($blog->id, $comment->blog?->id);
        $this->assertSame($commenter->id, $comment->commenter?->id);
    }

    public function test_deleting_blog_cascades_its_comments(): void
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();

        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'How to Prepare for Exams',
            'content' => 'Start early and review actively.',
        ]);

        BlogComment::query()->create([
            'blog_id' => $blog->id,
            'commenter_user_id' => $commenter->id,
            'comment_text' => 'Great reminder.',
        ]);

        $blog->delete();

        $this->assertDatabaseCount('blogs', 0);
        $this->assertDatabaseCount('blog_comments', 0);
    }

    public function test_deleting_commenter_sets_commenter_user_id_to_null(): void
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();

        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Study Group Tips',
            'content' => 'Stay consistent and define clear goals.',
        ]);

        $comment = BlogComment::query()->create([
            'blog_id' => $blog->id,
            'commenter_user_id' => $commenter->id,
            'comment_text' => 'I like this approach.',
        ]);

        $commenter->delete();
        $comment->refresh();

        $this->assertNull($comment->commenter_user_id);
        $this->assertNotNull($comment->blog_id);
    }
}

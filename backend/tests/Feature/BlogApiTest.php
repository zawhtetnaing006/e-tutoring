<?php

namespace Tests\Feature;

use App\Models\Blog;
use App\Models\BlogComment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BlogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_list_blogs(): void
    {
        $author = User::factory()->create();
        Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Public Blog Post',
            'content' => 'This blog should be visible publicly.',
        ]);

        $response = $this->getJson('/api/blogs');

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_list_blogs(): void
    {
        $author = User::factory()->create();
        Sanctum::actingAs($author);

        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Authenticated Blog List',
            'content' => 'Only signed-in users should see this list.',
        ]);

        $response = $this->getJson('/api/blogs');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'current_page',
                'total_page',
                'total_items',
            ]);

        $this->assertSame($blog->id, $response->json('data.0.id'));
        $this->assertSame('Authenticated Blog List', $response->json('data.0.title'));
    }

    public function test_guest_cannot_create_blog(): void
    {
        $response = $this->postJson('/api/blogs', [
            'title' => 'Unauthorized Post',
            'content' => 'This should fail.',
        ]);

        $response->assertUnauthorized();
    }

    public function test_guest_cannot_create_blog_comment(): void
    {
        $author = User::factory()->create();
        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Blog For Comments',
            'content' => 'Guests should not comment.',
        ]);

        $response = $this->postJson('/api/blogs/' . $blog->id . '/comments', [
            'comment_text' => 'Guest comment',
        ]);

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_create_blog(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/blogs', [
            'title' => 'Authenticated Blog',
            'content' => 'This post is created by an authenticated user.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonFragment([
                'title' => 'Authenticated Blog',
            ]);

        $this->assertDatabaseHas('blogs', [
            'author_user_id' => $user->id,
            'title' => 'Authenticated Blog',
        ]);
    }

    public function test_authenticated_user_can_comment_on_blog(): void
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();
        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Commentable Blog',
            'content' => 'Users can comment on this blog.',
        ]);

        Sanctum::actingAs($commenter);

        $response = $this->postJson('/api/blogs/' . $blog->id . '/comments', [
            'comment_text' => 'Great article!',
        ]);

        $response
            ->assertCreated()
            ->assertJsonFragment([
                'blog_id' => $blog->id,
                'comment_text' => 'Great article!',
            ]);

        $this->assertDatabaseHas('blog_comments', [
            'blog_id' => $blog->id,
            'commenter_user_id' => $commenter->id,
            'comment_text' => 'Great article!',
        ]);
    }

    public function test_public_can_view_blog_comments(): void
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();
        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Blog With Public Comments',
            'content' => 'Comments should be visible to everyone.',
        ]);

        BlogComment::query()->create([
            'blog_id' => $blog->id,
            'commenter_user_id' => $commenter->id,
            'comment_text' => 'Helpful post.',
        ]);

        $response = $this->getJson('/api/blogs/' . $blog->id . '/comments');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'current_page',
                'total_page',
                'total_items',
            ]);

        $this->assertSame('Helpful post.', $response->json('data.0.comment_text'));
    }
}

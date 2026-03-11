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
        $response = $this->getJson('/api/blogs');

        $response->assertUnauthorized();
    }

    public function test_guest_cannot_view_blog_details(): void
    {
        $author = User::factory()->create();
        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Private blog detail',
            'content' => 'Details require auth.',
        ]);

        $response = $this->getJson('/api/blogs/' . $blog->id);

        $response->assertUnauthorized();
    }

    public function test_guest_cannot_list_blog_comments(): void
    {
        $author = User::factory()->create();
        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Comments require auth',
            'content' => 'Guest cannot read comments.',
        ]);

        $response = $this->getJson('/api/blogs/' . $blog->id . '/comments');

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

    public function test_authenticated_user_can_create_blog(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/blogs', [
            'title' => 'Authenticated Blog',
            'content' => 'This post is created by an authenticated user.',
            'hashtags' => 'study,mathematics',
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

    public function test_author_can_update_own_blog(): void
    {
        $author = User::factory()->create();
        Sanctum::actingAs($author);

        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Old Title',
            'content' => 'Old content',
        ]);

        $response = $this->putJson('/api/blogs/' . $blog->id, [
            'title' => 'Updated Title',
            'hashtags' => 'updated,study',
        ]);

        $response
            ->assertOk()
            ->assertJsonFragment([
                'title' => 'Updated Title',
            ]);

        $this->assertDatabaseHas('blogs', [
            'id' => $blog->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_non_author_non_staff_cannot_update_blog(): void
    {
        $author = User::factory()->create();
        $anotherUser = User::factory()->create(['user_type' => User::TYPE_STUDENT]);

        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Protected Blog',
            'content' => 'Protected content',
        ]);

        Sanctum::actingAs($anotherUser);

        $response = $this->putJson('/api/blogs/' . $blog->id, [
            'title' => 'Attempted Edit',
        ]);

        $response->assertForbidden();
    }

    public function test_author_can_toggle_blog_status(): void
    {
        $author = User::factory()->create();
        Sanctum::actingAs($author);

        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Toggle Status Blog',
            'content' => 'Testing status toggle',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/blogs/' . $blog->id . '/toggle-status');

        $response
            ->assertOk()
            ->assertJsonFragment([
                'id' => $blog->id,
                'is_active' => false,
            ]);

        $this->assertDatabaseHas('blogs', [
            'id' => $blog->id,
            'is_active' => false,
        ]);
    }

    public function test_author_can_delete_own_blog(): void
    {
        $author = User::factory()->create();
        Sanctum::actingAs($author);

        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Delete me',
            'content' => 'to be deleted',
        ]);

        $response = $this->deleteJson('/api/blogs/' . $blog->id);

        $response->assertNoContent();

        $this->assertDatabaseMissing('blogs', [
            'id' => $blog->id,
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

    public function test_authenticated_user_can_view_blog_comments(): void
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();
        $viewer = User::factory()->create();

        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Blog With Comments',
            'content' => 'Comments should be visible to signed-in users.',
        ]);

        BlogComment::query()->create([
            'blog_id' => $blog->id,
            'commenter_user_id' => $commenter->id,
            'comment_text' => 'Helpful post.',
        ]);

        Sanctum::actingAs($viewer);

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

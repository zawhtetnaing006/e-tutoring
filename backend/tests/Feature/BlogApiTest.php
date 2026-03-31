<?php

namespace Tests\Feature;

use App\Models\Blog;
use App\Models\BlogComment;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BlogApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

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
        $student = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::STUDENT)->value('id'),
        ]);
        Sanctum::actingAs($student);

        $activeBlog = Blog::query()->create([
            'author_user_id' => $student->id,
            'title' => 'Authenticated Blog List',
            'content' => 'Only signed-in users should see this list.',
            'is_active' => true,
        ]);
        Blog::query()->create([
            'author_user_id' => $student->id,
            'title' => 'Hidden Inactive Blog',
            'content' => 'Students should not see inactive blogs.',
            'is_active' => false,
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

        $this->assertSame($activeBlog->id, $response->json('data.0.id'));
        $this->assertSame('Authenticated Blog List', $response->json('data.0.title'));
        $this->assertCount(1, $response->json('data'));
    }

    public function test_staff_can_create_blog(): void
    {
        $staff = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::STAFF)->value('id'),
        ]);
        Sanctum::actingAs($staff);

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
            'author_user_id' => $staff->id,
            'title' => 'Authenticated Blog',
        ]);
    }

    public function test_tutor_cannot_create_blog(): void
    {
        $tutor = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::TUTOR)->value('id'),
        ]);
        Sanctum::actingAs($tutor);

        $response = $this->postJson('/api/blogs', [
            'title' => 'Tutor Blog',
            'content' => 'Tutors should be read-only here.',
        ]);

        $response->assertForbidden();
    }

    public function test_staff_can_update_blog(): void
    {
        $staff = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::STAFF)->value('id'),
        ]);
        $author = User::factory()->create();
        Sanctum::actingAs($staff);

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

    public function test_tutor_cannot_update_blog(): void
    {
        $author = User::factory()->create();
        $tutor = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::TUTOR)->value('id'),
        ]);

        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Protected Blog',
            'content' => 'Protected content',
        ]);

        Sanctum::actingAs($tutor);

        $response = $this->putJson('/api/blogs/' . $blog->id, [
            'title' => 'Attempted Edit',
        ]);

        $response->assertForbidden();
    }

    public function test_staff_can_toggle_blog_status(): void
    {
        $staff = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::STAFF)->value('id'),
        ]);
        $author = User::factory()->create();
        Sanctum::actingAs($staff);

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

    public function test_staff_can_delete_blog(): void
    {
        $staff = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::STAFF)->value('id'),
        ]);
        $author = User::factory()->create();
        Sanctum::actingAs($staff);

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

    public function test_student_cannot_view_inactive_blog_details(): void
    {
        $author = User::factory()->create();
        $student = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::STUDENT)->value('id'),
        ]);
        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Inactive Blog',
            'content' => 'Students should not open inactive blogs.',
            'is_active' => false,
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/blogs/' . $blog->id);

        $response->assertNotFound();
    }

    public function test_staff_can_comment_on_blog(): void
    {
        $author = User::factory()->create();
        $staff = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::STAFF)->value('id'),
        ]);
        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Commentable Blog',
            'content' => 'Staff can comment on this blog.',
        ]);

        Sanctum::actingAs($staff);

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
            'commenter_user_id' => $staff->id,
            'comment_text' => 'Great article!',
        ]);
    }

    public function test_tutor_cannot_comment_on_blog(): void
    {
        $author = User::factory()->create();
        $tutor = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::TUTOR)->value('id'),
        ]);
        $blog = Blog::query()->create([
            'author_user_id' => $author->id,
            'title' => 'Commentable Blog',
            'content' => 'Tutors should be read-only here.',
        ]);

        Sanctum::actingAs($tutor);

        $response = $this->postJson('/api/blogs/' . $blog->id . '/comments', [
            'comment_text' => 'Attempted comment',
        ]);

        $response->assertForbidden();
    }

    public function test_student_can_view_blog_comments(): void
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();
        $viewer = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::STUDENT)->value('id'),
        ]);

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

<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Notification as BaseNotification;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_user_can_list_their_notifications(): void
    {
        $user = $this->createUserWithRole(Role::STUDENT);
        $otherUser = $this->createUserWithRole(Role::TUTOR);

        Carbon::setTestNow('2026-03-16 10:00:00');
        $user->notify(new FakeDatabaseNotification([
            'title' => 'First message',
            'body' => 'You have a new message.',
            'action' => [
                'route' => '/communication-hub',
                'query' => [
                    'conversation' => 11,
                ],
                'conversation_id' => 11,
            ],
        ]));

        Carbon::setTestNow('2026-03-16 10:01:00');
        $user->notify(new FakeDatabaseNotification([
            'title' => 'Second message',
            'body' => 'You have another message.',
            'action' => [
                'route' => '/communication-hub',
                'query' => [
                    'conversation' => 12,
                ],
                'conversation_id' => 12,
            ],
        ]));

        Carbon::setTestNow('2026-03-16 10:02:00');
        $otherUser->notify(new FakeDatabaseNotification([
            'title' => 'Other user message',
            'body' => 'Should not be returned.',
        ]));

        Carbon::setTestNow();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/notifications');

        $response
            ->assertOk()
            ->assertJsonPath('total_items', 2)
            ->assertJsonPath('data.0.type', 'fake_database')
            ->assertJsonPath('data.0.title', 'Second message')
            ->assertJsonPath('data.0.body', 'You have another message.')
            ->assertJsonPath('data.0.is_read', false)
            ->assertJsonPath('data.0.action.route', '/communication-hub')
            ->assertJsonPath('data.0.action.query.conversation', 12)
            ->assertJsonPath('data.0.action.conversation_id', 12)
            ->assertJsonPath('data.1.title', 'First message');
    }

    public function test_it_keeps_backward_compatible_chat_action_fallback_from_conversation_id(): void
    {
        $user = $this->createUserWithRole(Role::STUDENT);

        $user->notify(new FakeDatabaseNotification([
            'title' => 'Legacy message',
            'conversation_id' => 27,
        ]));

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/notifications');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.action.route', '/communication-hub')
            ->assertJsonPath('data.0.action.query.conversation', 27)
            ->assertJsonPath('data.0.action.conversation_id', 27);
    }

    public function test_user_can_mark_single_notification_as_read(): void
    {
        $user = $this->createUserWithRole(Role::STUDENT);
        $user->notify(new FakeDatabaseNotification([
            'title' => 'Unread notification',
        ]));

        $notificationId = $user->notifications()->value('id');

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/notifications/' . $notificationId . '/read');

        $response
            ->assertOk()
            ->assertJsonPath('id', $notificationId)
            ->assertJsonPath('is_read', true);

        $this->assertDatabaseMissing('notifications', [
            'id' => $notificationId,
            'read_at' => null,
        ]);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = $this->createUserWithRole(Role::STUDENT);
        $user->notify(new FakeDatabaseNotification([
            'title' => 'Unread one',
        ]));
        $user->notify(new FakeDatabaseNotification([
            'title' => 'Unread two',
        ]));

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/notifications/read-all');

        $response
            ->assertOk()
            ->assertJsonPath('marked_count', 2);

        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());
    }

    public function test_user_can_get_unread_notification_count(): void
    {
        $user = $this->createUserWithRole(Role::STUDENT);
        $user->notify(new FakeDatabaseNotification([
            'title' => 'Unread one',
        ]));
        $user->notify(new FakeDatabaseNotification([
            'title' => 'Unread two',
        ]));

        $readNotification = $user->notifications()->latest('created_at')->firstOrFail();
        $readNotification->markAsRead();

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/notifications/unread-count');

        $response
            ->assertOk()
            ->assertJsonPath('count', 1);
    }

    private function createUserWithRole(string $roleCode): User
    {
        $user = User::factory()->create([
            'is_active' => true,
        ]);

        $roleId = Role::query()
            ->where('code', $roleCode)
            ->value('id');

        $user->update([
            'role_id' => $roleId,
        ]);

        return $user->load('role');
    }
}

class FakeDatabaseNotification extends BaseNotification
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        private readonly array $payload
    ) {
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->payload;
    }
}

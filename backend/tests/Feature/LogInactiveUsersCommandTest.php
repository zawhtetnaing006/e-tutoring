<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use App\Notifications\InactiveUserReminderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class LogInactiveUsersCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_logs_and_notifies_inactive_users(): void
    {
        Notification::fake();

        $inactiveUser = User::factory()->create([
            'created_at' => now()->subDays(29),
        ]);

        $activeUser = User::factory()->create([
            'created_at' => now()->subDays(7),
        ]);

        $this->artisan('activity-log:log-inactive-users --days=28')
            ->expectsOutputToContain('logged 1 inactive users')
            ->assertSuccessful();

        Notification::assertSentTo($inactiveUser, InactiveUserReminderNotification::class);
        Notification::assertNotSentTo($activeUser, InactiveUserReminderNotification::class);

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'audit',
            'description' => 'user.inactive_detected',
            'target_type' => User::class,
            'target_id' => $inactiveUser->id,
            'event' => 'inactivity_detected',
        ]);
    }

    public function test_it_does_not_notify_the_same_user_twice_on_the_same_day(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'created_at' => now()->subDays(29),
        ]);

        Activity::query()->create([
            'log_name' => 'audit',
            'description' => 'user.inactive_detected',
            'target_type' => User::class,
            'target_id' => $user->id,
            'event' => 'inactivity_detected',
            'batch_uuid' => (string) Str::uuid(),
            'properties' => [
                'meta' => [
                    'action_label' => 'USER_INACTIVE_THRESHOLD_REACHED',
                    'target_label' => sprintf('User#%d', $user->id),
                    'description' => 'Already logged today.',
                ],
            ],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('activity-log:log-inactive-users --days=28')->assertSuccessful();

        Notification::assertNothingSent();
    }
}

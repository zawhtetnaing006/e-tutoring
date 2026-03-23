<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use App\Notifications\InactiveUserReminderNotification;
use App\Notifications\StudentInactiveTutorReminderNotification;
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

    public function test_it_notifies_inactive_students_and_their_active_tutors(): void
    {
        Notification::fake();

        $studentRole = Role::query()->create([
            'code' => Role::STUDENT,
            'name' => 'Student',
        ]);

        $tutorRole = Role::query()->create([
            'code' => Role::TUTOR,
            'name' => 'Tutor',
        ]);

        $inactiveStudent = User::factory()->create([
            'role_id' => $studentRole->id,
            'created_at' => now()->subDays(29),
        ]);

        $activeTutor = User::factory()->create([
            'role_id' => $tutorRole->id,
        ]);

        TutorAssignment::query()->create([
            'tutor_user_id' => $activeTutor->id,
            'student_user_id' => $inactiveStudent->id,
            'start_date' => now()->subDays(10)->toDateString(),
            'end_date' => now()->addDays(10)->toDateString(),
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        $this->artisan('activity-log:log-inactive-users --days=28')
            ->expectsOutputToContain('emailed 2 recipients')
            ->assertSuccessful();

        Notification::assertSentTo($inactiveStudent, InactiveUserReminderNotification::class);
        Notification::assertSentTo($activeTutor, StudentInactiveTutorReminderNotification::class);
    }

    public function test_it_notifies_the_latest_tutor_when_inactive_student_has_no_active_assignment(): void
    {
        Notification::fake();

        $studentRole = Role::query()->create([
            'code' => Role::STUDENT,
            'name' => 'Student',
        ]);

        $tutorRole = Role::query()->create([
            'code' => Role::TUTOR,
            'name' => 'Tutor',
        ]);

        $inactiveStudent = User::factory()->create([
            'role_id' => $studentRole->id,
            'created_at' => now()->subDays(40),
        ]);

        $olderTutor = User::factory()->create([
            'role_id' => $tutorRole->id,
        ]);

        $latestTutor = User::factory()->create([
            'role_id' => $tutorRole->id,
        ]);

        TutorAssignment::query()->create([
            'tutor_user_id' => $olderTutor->id,
            'student_user_id' => $inactiveStudent->id,
            'start_date' => now()->subDays(80)->toDateString(),
            'end_date' => now()->subDays(40)->toDateString(),
            'status' => TutorAssignment::STATUS_INACTIVE,
        ]);

        TutorAssignment::query()->create([
            'tutor_user_id' => $latestTutor->id,
            'student_user_id' => $inactiveStudent->id,
            'start_date' => now()->subDays(39)->toDateString(),
            'end_date' => now()->subDays(5)->toDateString(),
            'status' => TutorAssignment::STATUS_INACTIVE,
        ]);

        $this->artisan('activity-log:log-inactive-users --days=28')
            ->expectsOutputToContain('emailed 2 recipients')
            ->assertSuccessful();

        Notification::assertSentTo($inactiveStudent, InactiveUserReminderNotification::class);
        Notification::assertSentTo($latestTutor, StudentInactiveTutorReminderNotification::class);
        Notification::assertNotSentTo($olderTutor, StudentInactiveTutorReminderNotification::class);
    }
}

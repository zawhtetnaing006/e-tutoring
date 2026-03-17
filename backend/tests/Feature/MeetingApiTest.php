<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use App\Notifications\NewScheduleAssigned;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Events\BroadcastNotificationCreated;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MeetingApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_creating_meeting_notifies_assigned_tutor_and_student(): void
    {
        $staff = $this->createUserWithRole(Role::STAFF);
        $tutor = $this->createUserWithRole(Role::TUTOR);
        $student = $this->createUserWithRole(Role::STUDENT);

        $assignment = TutorAssignment::query()->create([
            'tutor_user_id' => $tutor->id,
            'student_user_id' => $student->id,
            'start_date' => '2026-03-01',
            'end_date' => '2026-03-31',
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        Event::fake([BroadcastNotificationCreated::class]);
        Sanctum::actingAs($staff);

        $response = $this->postJson('/api/meetings', [
            'title' => 'Math Session',
            'description' => 'Weekly tutoring',
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/abc',
            'location' => null,
            'tutor_assignment_id' => $assignment->id,
            'meeting_schedules' => [[
                'date' => '2026-03-20',
                'start_time' => '09:00',
                'end_time' => '10:00',
            ]],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('title', 'Math Session')
            ->assertJsonPath('meeting_schedules.0.date', '2026-03-20');

        $this->assertDatabaseCount('notifications', 2);
        $this->assertSame(0, $staff->fresh()->notifications()->count());

        $tutorNotification = $tutor->fresh()->notifications()->firstOrFail();
        $studentNotification = $student->fresh()->notifications()->firstOrFail();

        $this->assertSame(NewScheduleAssigned::class, $tutorNotification->type);
        $this->assertSame(NewScheduleAssigned::class, $studentNotification->type);
        $this->assertSame('New Schedule Assigned', $tutorNotification->data['title'] ?? null);
        $this->assertSame('A new schedule has been assigned for Math Session.', $tutorNotification->data['body'] ?? null);
        $this->assertSame('New Schedule Assigned', $studentNotification->data['title'] ?? null);
        $this->assertSame('A new schedule has been assigned for Math Session.', $studentNotification->data['body'] ?? null);

        Event::assertDispatched(BroadcastNotificationCreated::class);
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

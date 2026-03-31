<?php

namespace Tests\Feature;

use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\MeetingSchedule;
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

    public function test_tutor_can_create_meeting_for_own_assignment(): void
    {
        $tutor = $this->createUserWithRole(Role::TUTOR);
        $otherTutor = $this->createUserWithRole(Role::TUTOR);
        $student = $this->createUserWithRole(Role::STUDENT);
        $otherStudent = $this->createUserWithRole(Role::STUDENT);

        $ownAssignment = TutorAssignment::query()->create([
            'tutor_user_id' => $tutor->id,
            'student_user_id' => $student->id,
            'start_date' => '2026-03-01',
            'end_date' => '2026-03-31',
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        $otherAssignment = TutorAssignment::query()->create([
            'tutor_user_id' => $otherTutor->id,
            'student_user_id' => $otherStudent->id,
            'start_date' => '2026-03-01',
            'end_date' => '2026-03-31',
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        Event::fake([BroadcastNotificationCreated::class]);
        Sanctum::actingAs($tutor);

        $response = $this->postJson('/api/meetings', [
            'title' => 'Tutor session',
            'description' => null,
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/xyz',
            'location' => null,
            'tutor_assignment_id' => $ownAssignment->id,
            'meeting_schedules' => [[
                'date' => '2026-03-20',
                'start_time' => '09:00',
                'end_time' => '10:00',
            ]],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('title', 'Tutor session');

        $this->postJson('/api/meetings', [
            'title' => 'Should fail',
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/xyz',
            'location' => null,
            'tutor_assignment_id' => $otherAssignment->id,
            'meeting_schedules' => [[
                'date' => '2026-03-20',
                'start_time' => '09:00',
                'end_time' => '10:00',
            ]],
        ])->assertForbidden();
    }

    public function test_student_can_list_and_view_own_meetings_but_cannot_create(): void
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

        Sanctum::actingAs($staff);
        $createResponse = $this->postJson('/api/meetings', [
            'title' => 'Shared session',
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/abc',
            'location' => null,
            'tutor_assignment_id' => $assignment->id,
            'meeting_schedules' => [[
                'date' => '2026-03-22',
                'start_time' => '09:00',
                'end_time' => '10:00',
            ]],
        ]);
        $createResponse->assertCreated();
        $meetingId = (int) $createResponse->json('id');

        Sanctum::actingAs($student);
        $this->getJson('/api/meetings')->assertOk()->assertJsonPath('data.0.id', $meetingId);
        $this->getJson("/api/meetings/{$meetingId}")->assertOk()->assertJsonPath('title', 'Shared session');

        $this->postJson('/api/meetings', [
            'title' => 'Student attempt',
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/x',
            'location' => null,
            'tutor_assignment_id' => $assignment->id,
            'meeting_schedules' => [[
                'date' => '2026-03-23',
                'start_time' => '09:00',
                'end_time' => '10:00',
            ]],
        ])->assertForbidden();

        $this->putJson("/api/meetings/{$meetingId}", [
            'title' => 'Hacked',
        ])->assertForbidden();
    }

    public function test_meeting_details_returns_student_attendance_and_lock_state(): void
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

        $meeting = Meeting::query()->create([
            'title' => 'Details session',
            'description' => 'Review attendance state',
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/details',
            'location' => null,
            'tutor_assignment_id' => $assignment->id,
        ]);

        MeetingSchedule::query()->create([
            'meeting_id' => $meeting->id,
            'date' => '2026-03-22',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'note' => 'Bring practice work.',
        ]);

        MeetingAttendee::query()->create([
            'meeting_id' => $meeting->id,
            'user_id' => $student->id,
            'status' => 'PRESENCE',
        ]);

        Sanctum::actingAs($staff);

        $this->getJson("/api/meetings/{$meeting->id}/details")
            ->assertOk()
            ->assertJsonPath('id', $meeting->id)
            ->assertJsonPath('student_attendance.user_id', $student->id)
            ->assertJsonPath('student_attendance.status', 'PRESENCE')
            ->assertJsonPath('attendance_locked', true)
            ->assertJsonPath('meeting_schedules.0.note', 'Bring practice work.');
    }

    public function test_tutor_can_record_attendance_once_for_own_meeting_and_cannot_change_it(): void
    {
        $tutor = $this->createUserWithRole(Role::TUTOR);
        $student = $this->createUserWithRole(Role::STUDENT);

        $assignment = TutorAssignment::query()->create([
            'tutor_user_id' => $tutor->id,
            'student_user_id' => $student->id,
            'start_date' => '2026-03-01',
            'end_date' => '2026-03-31',
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        $meeting = Meeting::query()->create([
            'title' => 'Attendance session',
            'description' => null,
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/attendance',
            'location' => null,
            'tutor_assignment_id' => $assignment->id,
        ]);

        MeetingSchedule::query()->create([
            'meeting_id' => $meeting->id,
            'date' => '2026-03-22',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
        ]);

        Sanctum::actingAs($tutor);

        $this->postJson('/api/meeting-attendances', [
            'meeting_id' => $meeting->id,
            'user_id' => $student->id,
            'status' => 'PRESENCE',
        ])->assertCreated()
            ->assertJsonPath('meeting_id', $meeting->id)
            ->assertJsonPath('user_id', $student->id)
            ->assertJsonPath('status', 'PRESENCE');

        $this->postJson('/api/meeting-attendances', [
            'meeting_id' => $meeting->id,
            'user_id' => $student->id,
            'status' => 'ABSENCE',
        ])->assertUnprocessable()
            ->assertJsonPath(
                'error.details.errors.user_id.0',
                'Attendance has already been recorded for this student in this meeting.'
            );
    }

    public function test_tutor_can_update_note_for_own_meeting_schedule(): void
    {
        $tutor = $this->createUserWithRole(Role::TUTOR);
        $student = $this->createUserWithRole(Role::STUDENT);

        $assignment = TutorAssignment::query()->create([
            'tutor_user_id' => $tutor->id,
            'student_user_id' => $student->id,
            'start_date' => '2026-03-01',
            'end_date' => '2026-03-31',
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        $meeting = Meeting::query()->create([
            'title' => 'Notes session',
            'description' => null,
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/notes',
            'location' => null,
            'tutor_assignment_id' => $assignment->id,
        ]);

        $schedule = MeetingSchedule::query()->create([
            'meeting_id' => $meeting->id,
            'date' => '2026-03-22',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'note' => null,
        ]);

        Sanctum::actingAs($tutor);

        $this->putJson("/api/meeting-schedules/{$schedule->id}", [
            'note' => 'Student completed revision tasks.',
        ])->assertOk()
            ->assertJsonPath('note', 'Student completed revision tasks.');
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

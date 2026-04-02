<?php

namespace Tests\Feature;

use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\MeetingSchedule;
use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use App\Notifications\MeetingScheduleCancelledNotification;
use App\Notifications\MeetingScheduleUpdatedNotification;
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
        $this->assertSame('/meeting-manager', $tutorNotification->data['action']['route'] ?? null);
        $this->assertSame($meetingId = $response->json('id'), $tutorNotification->data['action']['query']['meeting'] ?? null);
        $this->assertSame('New Schedule Assigned', $studentNotification->data['title'] ?? null);
        $this->assertSame('A new schedule has been assigned for Math Session.', $studentNotification->data['body'] ?? null);
        $this->assertSame('/meeting-manager', $studentNotification->data['action']['route'] ?? null);
        $this->assertSame($meetingId, $studentNotification->data['action']['query']['meeting'] ?? null);

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

    public function test_student_can_list_own_meeting_schedules_with_meeting_info(): void
    {
        $staff = $this->createUserWithRole(Role::STAFF);
        $tutor = $this->createUserWithRole(Role::TUTOR);
        $student = $this->createUserWithRole(Role::STUDENT);
        $otherTutor = $this->createUserWithRole(Role::TUTOR);
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

        $ownMeeting = Meeting::query()->create([
            'title' => 'Own schedule session',
            'description' => 'Student-owned meeting',
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/own',
            'location' => null,
            'tutor_assignment_id' => $ownAssignment->id,
        ]);

        $ownSchedule = MeetingSchedule::query()->create([
            'meeting_id' => $ownMeeting->id,
            'date' => '2026-03-22',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
        ]);

        MeetingSchedule::query()->create([
            'meeting_id' => $ownMeeting->id,
            'date' => '2026-03-29',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'cancel_at' => now(),
        ]);

        $otherMeeting = Meeting::query()->create([
            'title' => 'Hidden schedule session',
            'description' => null,
            'type' => 'PHYSICAL',
            'platform' => null,
            'link' => null,
            'location' => 'Room 101',
            'tutor_assignment_id' => $otherAssignment->id,
        ]);

        MeetingSchedule::query()->create([
            'meeting_id' => $otherMeeting->id,
            'date' => '2026-03-23',
            'start_time' => '11:00:00',
            'end_time' => '12:00:00',
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/meeting-schedules')
            ->assertOk()
            ->assertJsonPath('total_items', 1)
            ->assertJsonPath('data.0.id', $ownSchedule->id)
            ->assertJsonPath('data.0.meeting_id', $ownMeeting->id)
            ->assertJsonPath('data.0.meeting.id', $ownMeeting->id)
            ->assertJsonPath('data.0.meeting.title', 'Own schedule session')
            ->assertJsonPath('data.0.meeting.tutor_name', $tutor->name)
            ->assertJsonPath('data.0.meeting.student_name', $student->name)
            ->assertJsonPath('data.0.meeting.schedule_count', 1);
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

        $schedule = MeetingSchedule::query()->create([
            'meeting_id' => $meeting->id,
            'date' => '2026-03-22',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'note' => 'Bring practice work.',
        ]);

        MeetingAttendee::query()->create([
            'meeting_id' => $meeting->id,
            'meeting_schedule_id' => $schedule->id,
            'user_id' => $student->id,
            'status' => 'PRESENCE',
        ]);

        Sanctum::actingAs($staff);

        $this->getJson("/api/meetings/{$meeting->id}/details?schedule_id={$schedule->id}")
            ->assertOk()
            ->assertJsonPath('id', $meeting->id)
            ->assertJsonPath('selected_schedule_id', $schedule->id)
            ->assertJsonPath('student_attendance.meeting_schedule_id', $schedule->id)
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

        $schedule = MeetingSchedule::query()->create([
            'meeting_id' => $meeting->id,
            'date' => '2026-03-22',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
        ]);

        $nextSchedule = MeetingSchedule::query()->create([
            'meeting_id' => $meeting->id,
            'date' => '2026-03-29',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
        ]);

        Sanctum::actingAs($tutor);

        $this->postJson('/api/meeting-attendances', [
            'meeting_schedule_id' => $schedule->id,
            'user_id' => $student->id,
            'status' => 'PRESENCE',
        ])->assertCreated()
            ->assertJsonPath('meeting_id', $meeting->id)
            ->assertJsonPath('meeting_schedule_id', $schedule->id)
            ->assertJsonPath('user_id', $student->id)
            ->assertJsonPath('status', 'PRESENCE');

        $this->postJson('/api/meeting-attendances', [
            'meeting_schedule_id' => $nextSchedule->id,
            'user_id' => $student->id,
            'status' => 'ABSENCE',
        ])->assertCreated()
            ->assertJsonPath('meeting_schedule_id', $nextSchedule->id)
            ->assertJsonPath('user_id', $student->id)
            ->assertJsonPath('status', 'ABSENCE');

        $this->postJson('/api/meeting-attendances', [
            'meeting_schedule_id' => $schedule->id,
            'user_id' => $student->id,
            'status' => 'ABSENCE',
        ])->assertUnprocessable()
            ->assertJsonPath(
                'error.details.errors.user_id.0',
                'Attendance has already been recorded for this student in this schedule.'
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

        Event::fake([BroadcastNotificationCreated::class]);
        Sanctum::actingAs($tutor);

        $this->putJson("/api/meeting-schedules/{$schedule->id}", [
            'note' => 'Student completed revision tasks.',
        ])->assertOk()
            ->assertJsonPath('note', 'Student completed revision tasks.');

        $this->assertDatabaseCount('notifications', 1);

        $notification = $student->fresh()->notifications()->firstOrFail();

        $this->assertSame(MeetingScheduleUpdatedNotification::class, $notification->type);
        $this->assertSame('Meeting Schedule Updated', $notification->data['title'] ?? null);
        $this->assertSame('The schedule for Notes session was updated: note.', $notification->data['body'] ?? null);
        $this->assertSame('/meeting-manager', $notification->data['action']['route'] ?? null);
        $this->assertSame($meeting->id, $notification->data['action']['query']['meeting'] ?? null);
        $this->assertSame($schedule->id, $notification->data['action']['query']['schedule'] ?? null);
        $this->assertSame(0, $tutor->fresh()->notifications()->count());

        Event::assertDispatched(BroadcastNotificationCreated::class);
    }

    public function test_staff_can_cancel_meeting_schedule_and_notify_tutor_and_student(): void
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
            'title' => 'Cancelled session',
            'description' => null,
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/cancel',
            'location' => null,
            'tutor_assignment_id' => $assignment->id,
        ]);

        $schedule = MeetingSchedule::query()->create([
            'meeting_id' => $meeting->id,
            'date' => '2026-03-24',
            'start_time' => '12:00:00',
            'end_time' => '13:00:00',
            'note' => null,
        ]);

        Event::fake([BroadcastNotificationCreated::class]);
        Sanctum::actingAs($staff);

        $this->postJson("/api/meeting-schedules/{$schedule->id}/cancel")
            ->assertOk()
            ->assertJsonPath('cancel_at', fn (mixed $value): bool => is_string($value) && $value !== '');

        $this->assertDatabaseCount('notifications', 2);

        $tutorNotification = $tutor->fresh()->notifications()->firstOrFail();
        $studentNotification = $student->fresh()->notifications()->firstOrFail();

        $this->assertSame(MeetingScheduleCancelledNotification::class, $tutorNotification->type);
        $this->assertSame('Meeting Schedule Cancelled', $tutorNotification->data['title'] ?? null);
        $this->assertSame('The schedule for Cancelled session has been cancelled.', $tutorNotification->data['body'] ?? null);
        $this->assertSame('/meeting-manager', $tutorNotification->data['action']['route'] ?? null);
        $this->assertSame($meeting->id, $tutorNotification->data['action']['query']['meeting'] ?? null);
        $this->assertSame($schedule->id, $tutorNotification->data['action']['query']['schedule'] ?? null);
        $this->assertSame(MeetingScheduleCancelledNotification::class, $studentNotification->type);
        $this->assertSame(0, $staff->fresh()->notifications()->count());

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

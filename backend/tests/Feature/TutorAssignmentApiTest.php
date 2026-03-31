<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use App\Notifications\AllocationAssignedNotification;
use App\Notifications\AllocationUpdatedNotification;
use App\Notifications\TutorAssignmentCreatedNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Events\BroadcastNotificationCreated;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TutorAssignmentApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_creating_tutor_assignment_sends_emails_to_both_tutor_and_student(): void
    {
        Notification::fake();

        $staff = $this->createUserWithRole(Role::STAFF, 'Staff User');
        $tutor = $this->createUserWithRole(Role::TUTOR, 'Tutor User');
        $student = $this->createUserWithRole(Role::STUDENT, 'Student User');

        Sanctum::actingAs($staff);

        $response = $this->postJson('/api/tutor-assignments', [
            'tutor_user_id' => $tutor->id,
            'student_user_ids' => [$student->id],
            'from_date' => '2026-04-01',
            'to_date' => '2026-04-30',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.0.tutor_user_id', $tutor->id)
            ->assertJsonPath('data.0.student_user_id', $student->id);

        Notification::assertSentTo($tutor, TutorAssignmentCreatedNotification::class);
        Notification::assertSentTo($student, TutorAssignmentCreatedNotification::class);
    }

    public function test_creating_tutor_assignment_creates_in_app_notifications_for_tutor_and_student(): void
    {
        $staff = $this->createUserWithRole(Role::STAFF, 'Staff User');
        $tutor = $this->createUserWithRole(Role::TUTOR, 'Tutor User');
        $student = $this->createUserWithRole(Role::STUDENT, 'Student User');

        Event::fake([BroadcastNotificationCreated::class]);
        Sanctum::actingAs($staff);

        $response = $this->postJson('/api/tutor-assignments', [
            'tutor_user_id' => $tutor->id,
            'student_user_ids' => [$student->id],
            'from_date' => '2026-04-01',
            'to_date' => '2026-04-30',
        ]);

        $response->assertCreated();

        $this->assertDatabaseCount('notifications', 2);

        $allocationId = $response->json('data.0.id');
        $tutorNotification = $tutor->fresh()->notifications()->firstOrFail();
        $studentNotification = $student->fresh()->notifications()->firstOrFail();

        $this->assertSame(AllocationAssignedNotification::class, $tutorNotification->type);
        $this->assertSame('New Allocation', $tutorNotification->data['title'] ?? null);
        $this->assertSame('A new allocation has been created for you with Student User.', $tutorNotification->data['body'] ?? null);
        $this->assertSame('/allocations', $tutorNotification->data['action']['route'] ?? null);
        $this->assertSame($allocationId, $tutorNotification->data['action']['query']['allocation'] ?? null);
        $this->assertSame(AllocationAssignedNotification::class, $studentNotification->type);
        $this->assertSame('A new allocation has been created for you with Tutor User.', $studentNotification->data['body'] ?? null);
        $this->assertSame(0, $staff->fresh()->notifications()->count());

        Event::assertDispatched(BroadcastNotificationCreated::class);
    }

    public function test_updating_tutor_assignment_creates_in_app_notifications_for_other_participants(): void
    {
        $staff = $this->createUserWithRole(Role::STAFF, 'Staff User');
        $tutor = $this->createUserWithRole(Role::TUTOR, 'Tutor User');
        $student = $this->createUserWithRole(Role::STUDENT, 'Student User');

        $assignment = TutorAssignment::query()->create([
            'tutor_user_id' => $tutor->id,
            'student_user_id' => $student->id,
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-30',
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        Event::fake([BroadcastNotificationCreated::class]);
        Sanctum::actingAs($staff);

        $this->putJson('/api/tutor-assignments/' . $assignment->id, [
            'status' => TutorAssignment::STATUS_INACTIVE,
        ])->assertOk()
            ->assertJsonPath('status', TutorAssignment::STATUS_INACTIVE);

        $this->assertDatabaseCount('notifications', 2);

        $tutorNotification = $tutor->fresh()->notifications()->firstOrFail();
        $studentNotification = $student->fresh()->notifications()->firstOrFail();

        $this->assertSame(AllocationUpdatedNotification::class, $tutorNotification->type);
        $this->assertSame('Allocation Updated', $tutorNotification->data['title'] ?? null);
        $this->assertSame('Your allocation with Student User was updated: status.', $tutorNotification->data['body'] ?? null);
        $this->assertSame('/allocations', $tutorNotification->data['action']['route'] ?? null);
        $this->assertSame($assignment->id, $tutorNotification->data['action']['query']['allocation'] ?? null);
        $this->assertSame(AllocationUpdatedNotification::class, $studentNotification->type);
        $this->assertSame('Your allocation with Tutor User was updated: status.', $studentNotification->data['body'] ?? null);
        $this->assertSame(0, $staff->fresh()->notifications()->count());

        Event::assertDispatched(BroadcastNotificationCreated::class);
    }

    private function createUserWithRole(string $roleCode, string $name): User
    {
        $user = User::factory()->create([
            'name' => $name,
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

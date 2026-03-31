<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Notifications\TutorAssignmentCreatedNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

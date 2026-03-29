<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class TutorAssignmentExportApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_staff_can_export_selected_tutor_assignments_to_excel(): void
    {
        $staff = $this->createUserWithRole(Role::STAFF);
        $tutorOne = $this->createUserWithRole(Role::TUTOR, 'Tutor One');
        $tutorTwo = $this->createUserWithRole(Role::TUTOR, 'Tutor Two');
        $studentOne = $this->createUserWithRole(Role::STUDENT, 'Student One');
        $studentTwo = $this->createUserWithRole(Role::STUDENT, 'Student Two');

        $firstAssignment = TutorAssignment::query()->create([
            'tutor_user_id' => $tutorOne->id,
            'student_user_id' => $studentOne->id,
            'start_date' => '2026-03-01',
            'end_date' => '2026-03-15',
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        $secondAssignment = TutorAssignment::query()->create([
            'tutor_user_id' => $tutorTwo->id,
            'student_user_id' => $studentTwo->id,
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-15',
            'status' => TutorAssignment::STATUS_INACTIVE,
        ]);

        Sanctum::actingAs($staff);

        $response = $this->postJson('/api/tutor-assignments/export', [
            'tutor_assignment_ids' => [$secondAssignment->id, $firstAssignment->id],
        ]);

        $response
            ->assertOk()
            ->assertHeader(
                'content-type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );

        $content = $response->streamedContent();
        $this->assertStringStartsWith('PK', $content);

        $tempFile = tempnam(sys_get_temp_dir(), 'allocations-export-');
        $this->assertNotFalse($tempFile);

        try {
            file_put_contents($tempFile, $content);

            $spreadsheet = IOFactory::load($tempFile);
            $sheet = $spreadsheet->getActiveSheet();

            $this->assertSame('Tutor', $sheet->getCell('A1')->getValue());
            $this->assertSame('Student', $sheet->getCell('B1')->getValue());
            $this->assertSame($tutorTwo->name, $sheet->getCell('A2')->getValue());
            $this->assertSame($studentTwo->name, $sheet->getCell('B2')->getValue());
            $this->assertSame('2026-04-01', $sheet->getCell('C2')->getValue());
            $this->assertSame('2026-04-15', $sheet->getCell('D2')->getValue());
            $this->assertSame('Inactive', $sheet->getCell('E2')->getValue());
            $this->assertSame($tutorOne->name, $sheet->getCell('A3')->getValue());
            $this->assertSame($studentOne->name, $sheet->getCell('B3')->getValue());

            $spreadsheet->disconnectWorksheets();
        } finally {
            @unlink($tempFile);
        }
    }

    public function test_tutor_can_export_their_own_tutor_assignments_to_excel(): void
    {
        $tutor = $this->createUserWithRole(Role::TUTOR, 'Tutor One');
        $student = $this->createUserWithRole(Role::STUDENT, 'Student One');

        $assignment = TutorAssignment::query()->create([
            'tutor_user_id' => $tutor->id,
            'student_user_id' => $student->id,
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-31',
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        Sanctum::actingAs($tutor);

        $response = $this->postJson('/api/tutor-assignments/export', [
            'tutor_assignment_ids' => [$assignment->id],
        ]);

        $response
            ->assertOk()
            ->assertHeader(
                'content-type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
    }

    public function test_tutor_cannot_export_other_tutors_assignments(): void
    {
        $requestingTutor = $this->createUserWithRole(Role::TUTOR, 'Requesting Tutor');
        $otherTutor = $this->createUserWithRole(Role::TUTOR, 'Other Tutor');
        $student = $this->createUserWithRole(Role::STUDENT, 'Student One');

        $otherAssignment = TutorAssignment::query()->create([
            'tutor_user_id' => $otherTutor->id,
            'student_user_id' => $student->id,
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-30',
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        Sanctum::actingAs($requestingTutor);

        $response = $this->postJson('/api/tutor-assignments/export', [
            'tutor_assignment_ids' => [$otherAssignment->id],
        ]);

        $response
            ->assertForbidden()
            ->assertJsonPath('message', 'Access denied for one or more tutor assignments.');
    }

    private function createUserWithRole(string $roleCode, ?string $name = null): User
    {
        $user = User::factory()->create([
            'name' => $name ?? $roleCode.' User',
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

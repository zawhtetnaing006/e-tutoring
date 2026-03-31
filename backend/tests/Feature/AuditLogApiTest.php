<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditLogApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_it_returns_human_readable_user_target_and_description(): void
    {
        $staff = $this->createUserWithRole(Role::STAFF, [
            'name' => 'Staff User',
        ]);
        $student = $this->createUserWithRole(Role::STUDENT, [
            'name' => 'Jane Student',
        ]);
        $targetLabel = sprintf('User#%d', $student->id);

        activity('audit')
            ->causedBy($staff)
            ->performedOn($student)
            ->withProperties([
                'meta' => [
                    'action_label' => 'CREATE_USER',
                    'target_label' => $targetLabel,
                    'description' => sprintf('Created %s.', $targetLabel),
                ],
            ])
            ->event('created')
            ->log('user.created');

        Sanctum::actingAs($staff);

        $response = $this->getJson('/api/audit-logs');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.actor', 'Staff User (Staff)')
            ->assertJsonPath('data.0.action', 'CREATE_USER')
            ->assertJsonPath('data.0.target', 'User: Jane Student (Student)')
            ->assertJsonPath('data.0.description', 'Created User: Jane Student (Student).');
    }

    public function test_it_humanizes_raw_target_labels_when_subject_cannot_be_loaded(): void
    {
        $staff = $this->createUserWithRole(Role::STAFF);

        Activity::query()->create([
            'log_name' => 'audit',
            'description' => 'user.deleted',
            'event' => 'deleted',
            'batch_uuid' => (string) Str::uuid(),
            'properties' => [
                'meta' => [
                    'action_label' => 'DELETE_USER',
                    'target_label' => 'User#37',
                    'description' => 'Deleted User#37.',
                ],
            ],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($staff);

        $response = $this->getJson('/api/audit-logs');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.target', 'User 37')
            ->assertJsonPath('data.0.description', 'Deleted User 37.');
    }

    private function createUserWithRole(string $roleCode, array $attributes = []): User
    {
        $roleId = Role::query()
            ->where('code', $roleCode)
            ->value('id');

        return User::factory()->create([
            'role_id' => $roleId,
            ...$attributes,
        ]);
    }
}

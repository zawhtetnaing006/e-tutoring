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

    public function test_it_returns_figma_style_action_target_and_description(): void
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
            ->assertJsonPath('data.0.target', $targetLabel)
            ->assertJsonPath('data.0.description', sprintf('Created %s.', $targetLabel));
    }

    public function test_it_preserves_compact_target_labels_when_subject_cannot_be_loaded(): void
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
            ->assertJsonPath('data.0.action', 'DELETE_USER')
            ->assertJsonPath('data.0.target', 'User#37')
            ->assertJsonPath('data.0.description', 'Deleted User#37.');
    }

    public function test_it_builds_a_compact_target_from_the_subject_when_meta_target_is_missing(): void
    {
        $staff = $this->createUserWithRole(Role::STAFF, [
            'name' => 'Staff User',
        ]);
        $student = $this->createUserWithRole(Role::STUDENT, [
            'name' => 'Jane Student',
        ]);

        activity('audit')
            ->causedBy($staff)
            ->performedOn($student)
            ->withProperties([
                'meta' => [
                    'action_label' => 'RESET_PASSWORD',
                ],
            ])
            ->event('updated')
            ->log('auth.reset_password');

        Sanctum::actingAs($staff);

        $response = $this->getJson('/api/audit-logs');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.action', 'RESET_PASSWORD')
            ->assertJsonPath('data.0.target', sprintf('Student#%d', $student->id))
            ->assertJsonPath('data.0.description', sprintf('Reset Password: Student#%d.', $student->id));
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

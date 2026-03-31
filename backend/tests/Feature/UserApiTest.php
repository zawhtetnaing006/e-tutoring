<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Notifications\UserGeneratedPasswordNotification;
use App\Notifications\UserWelcomeNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_creating_user_always_sends_welcome_email(): void
    {
        Notification::fake();

        $staff = $this->createUserWithRole(Role::STAFF);

        Sanctum::actingAs($staff);

        $response = $this->postJson('/api/users', [
            'name' => 'Manual Password Staff',
            'email' => 'manual-staff@example.test',
            'role_code' => Role::STAFF,
            'auto_generate_password' => false,
            'password' => 'password123',
            'phone' => '+1-555-1000',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('email', 'manual-staff@example.test')
            ->assertJsonPath('role_code', Role::STAFF);

        $createdUser = User::query()
            ->where('email', 'manual-staff@example.test')
            ->firstOrFail();

        Notification::assertSentTo($createdUser, UserWelcomeNotification::class);
        Notification::assertNotSentTo($createdUser, UserGeneratedPasswordNotification::class);
    }

    public function test_creating_user_with_auto_generated_password_sends_welcome_and_password_emails(): void
    {
        Notification::fake();

        $staff = $this->createUserWithRole(Role::STAFF);

        Sanctum::actingAs($staff);

        $response = $this->postJson('/api/users', [
            'name' => 'Generated Password Staff',
            'email' => 'generated-staff@example.test',
            'role_code' => Role::ADMIN,
            'auto_generate_password' => true,
            'phone' => '+1-555-2000',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('email', 'generated-staff@example.test')
            ->assertJsonPath('role_code', Role::ADMIN);

        $createdUser = User::query()
            ->where('email', 'generated-staff@example.test')
            ->firstOrFail();

        Notification::assertSentTo($createdUser, UserWelcomeNotification::class);
        Notification::assertSentTo($createdUser, UserGeneratedPasswordNotification::class);
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

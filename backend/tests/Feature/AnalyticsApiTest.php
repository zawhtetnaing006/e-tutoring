<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AnalyticsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_guest_cannot_access_analytics(): void
    {
        $response = $this->getJson('/api/analytics');

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_get_mock_analytics(): void
    {
        $user = User::factory()->create([
            'role_id' => Role::query()->where('code', Role::STUDENT)->value('id'),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/analytics');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'lastSevenDaysMessage',
                'meetingSchedules',
                'documentShares',
                'lastActiveAt',
                'personalTutor' => [
                    'image' => ['width', 'height', 'url'],
                ],
                'upcomingMeeting' => ['id', 'title', 'date', 'from', 'to', 'platform'],
                'lastblogs' => [
                    '*' => ['id', 'title', 'description', 'tags'],
                ],
            ])
            ->assertJsonPath('lastSevenDaysMessage', 10)
            ->assertJsonPath('meetingSchedules', 1)
            ->assertJsonPath('documentShares', 5)
            ->assertJsonPath('upcomingMeeting.title', 'Course work preview')
            ->assertJsonPath('upcomingMeeting.platform', 'Google Meet')
            ->assertJsonPath('lastblogs.0.tags.0', 'study');

        $this->assertMatchesRegularExpression(
            '/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/',
            (string) $response->json('lastActiveAt')
        );

        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}$/',
            (string) $response->json('upcomingMeeting.date')
        );
    }
}

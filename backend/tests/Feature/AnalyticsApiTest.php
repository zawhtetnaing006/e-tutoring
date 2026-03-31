<?php

namespace Tests\Feature;

use App\Models\Blog;
use App\Models\Conversation;
use App\Models\ConversationMember;
use App\Models\Document;
use App\Models\Meeting;
use App\Models\MeetingSchedule;
use App\Models\Message;
use App\Models\Role;
use App\Models\TutorAssignment;
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

    public function test_student_receives_role_based_analytics_with_limits(): void
    {
        $student = $this->createUserWithRole(Role::STUDENT);
        $tutor = $this->createUserWithRole(Role::TUTOR);

        $assignment = TutorAssignment::query()->create([
            'tutor_user_id' => $tutor->id,
            'student_user_id' => $student->id,
            'start_date' => now()->subDays(30)->toDateString(),
            'end_date' => now()->addDays(30)->toDateString(),
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        $conversation = Conversation::query()->create([
            'created_by_user_id' => $student->id,
            'direct_pair_key' => null,
            'last_message_at' => now(),
        ]);

        ConversationMember::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $student->id,
            'last_seen_at' => now()->subHour(),
        ]);

        ConversationMember::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $tutor->id,
            'last_seen_at' => now()->subHour(),
        ]);

        $recentMessageOne = Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $student->id,
            'content' => 'Message 1',
        ]);
        Message::query()->whereKey($recentMessageOne->id)->update([
            'created_at' => now()->subDays(1),
            'updated_at' => now()->subDays(1),
        ]);

        $recentMessageTwo = Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $student->id,
            'content' => 'Message 2',
        ]);
        Message::query()->whereKey($recentMessageTwo->id)->update([
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        $recentMessageThree = Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $student->id,
            'content' => 'Message 3',
        ]);
        Message::query()->whereKey($recentMessageThree->id)->update([
            'created_at' => now()->subDays(3),
            'updated_at' => now()->subDays(3),
        ]);

        $oldMessage = Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $student->id,
            'content' => 'Old message',
        ]);
        Message::query()->whereKey($oldMessage->id)->update([
            'created_at' => now()->subDays(10),
            'updated_at' => now()->subDays(10),
        ]);

        Document::query()->create([
            'conversation_id' => $conversation->id,
            'uploaded_by_user_id' => $student->id,
            'file_name' => 'lecture-notes.pdf',
            'file_path' => 'documents/lecture-notes.pdf',
            'file_size_bytes' => 2048,
            'mime_type' => 'application/pdf',
        ]);

        Document::query()->create([
            'conversation_id' => $conversation->id,
            'uploaded_by_user_id' => $student->id,
            'file_name' => 'worksheet.docx',
            'file_path' => 'documents/worksheet.docx',
            'file_size_bytes' => 4096,
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);

        $meeting = Meeting::query()->create([
            'title' => 'Course work preview',
            'description' => 'Prepare discussion points.',
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.google.com/abc-defg-hij',
            'location' => null,
            'tutor_assignment_id' => $assignment->id,
        ]);

        foreach (range(1, 6) as $offset) {
            MeetingSchedule::query()->create([
                'meeting_id' => $meeting->id,
                'date' => now()->addDays($offset)->toDateString(),
                'start_time' => '10:00:00',
                'end_time' => '10:40:00',
                'note' => 'Upcoming schedule',
            ]);
        }

        MeetingSchedule::query()->create([
            'meeting_id' => $meeting->id,
            'date' => now()->addDays(7)->toDateString(),
            'start_time' => '11:00:00',
            'end_time' => '11:40:00',
            'note' => 'Cancelled schedule',
            'cancel_at' => now(),
        ]);

        foreach (range(1, 6) as $index) {
            Blog::query()->create([
                'author_user_id' => $tutor->id,
                'title' => 'Blog #'.$index,
                'content' => 'Content for blog '.$index.'.',
                'hashtags' => ['study', 'tips'],
                'is_active' => true,
            ]);
        }

        Blog::query()->create([
            'author_user_id' => $tutor->id,
            'title' => 'Inactive Blog',
            'content' => 'Should not appear in latest list.',
            'hashtags' => ['hidden'],
            'is_active' => false,
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/analytics');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'lastSevenDaysMessage',
                'meetingSchedules',
                'documentShares',
                'lastLoginAt',
                'lastActiveAt',
                'personalTutor' => [
                    'id',
                    'uuid',
                    'name',
                    'headline',
                    'email',
                    'phone',
                    'is_active',
                    'avatar' => ['url', 'initials'],
                    'subjects',
                    'assignment' => ['id', 'from', 'to', 'status'],
                    'conversationId',
                ],
                'upcomingMeetings' => [
                    '*' => ['id', 'title', 'date', 'from', 'to', 'platform'],
                ],
                'latestBlogs' => [
                    '*' => [
                        'id',
                        'title',
                        'description',
                        'tags',
                        'coverImageUrl',
                        'viewCount',
                        'commentCount',
                        'created_at',
                        'author' => ['id', 'uuid', 'name', 'role_code'],
                    ],
                ],
            ])
            ->assertJsonPath('lastSevenDaysMessage', 3)
            ->assertJsonPath('meetingSchedules', 6)
            ->assertJsonPath('documentShares', 2);

        $payload = $response->json();
        $this->assertIsArray($payload['upcomingMeetings'] ?? null);
        $this->assertIsArray($payload['latestBlogs'] ?? null);
        $this->assertCount(5, $payload['upcomingMeetings']);
        $this->assertCount(2, $payload['latestBlogs']);
        $this->assertArrayNotHasKey('lastblogs', $payload);
        $this->assertArrayNotHasKey('upcomingMeeting', $payload);

        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/',
            (string) ($payload['lastActiveAt'] ?? '')
        );
    }

    public function test_tutor_receives_tutor_analytics_shape(): void
    {
        $tutor = $this->createUserWithRole(Role::TUTOR);
        $student = $this->createUserWithRole(Role::STUDENT);

        TutorAssignment::query()->create([
            'tutor_user_id' => $tutor->id,
            'student_user_id' => $student->id,
            'start_date' => now()->subDays(3)->toDateString(),
            'end_date' => now()->addDays(3)->toDateString(),
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        Sanctum::actingAs($tutor);

        $response = $this->getJson('/api/analytics');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'lastLoginAt',
                'displayName',
                'welcomeSubtitle',
                'totalTutees',
                'messagesLast7Days',
                'noInteractionStudents7PlusDays',
                'noInteractionStudents28PlusDays',
                'myStudents' => [
                    '*' => [
                        'studentId',
                        'studentUuid',
                        'studentName',
                        'semesterPeriod' => ['from', 'to', 'label'],
                        'lastInteractionAt',
                        'lastInteractionIso',
                        'conversationId',
                    ],
                ],
                'thisWeeksMeetingsCount',
                'thisWeeksMeetings',
                'latestBlogs',
            ])
            ->assertJsonPath('displayName', $tutor->name)
            ->assertJsonPath('totalTutees', 1)
            ->assertJsonPath('messagesLast7Days', 0)
            ->assertJsonPath('noInteractionStudents7PlusDays', 1)
            ->assertJsonPath('noInteractionStudents28PlusDays', 1)
            ->assertJsonPath('thisWeeksMeetingsCount', 0);

        $payload = $response->json();
        $this->assertArrayNotHasKey('personalTutor', $payload);
        $this->assertArrayNotHasKey('lastSevenDaysMessage', $payload);
        $this->assertArrayNotHasKey('assignedStudents', $payload);
        $this->assertArrayNotHasKey('upcomingMeetings', $payload);
        $this->assertArrayNotHasKey('upcomingMeeting', $payload);
    }

    public function test_staff_receives_staff_analytics_shape(): void
    {
        $staff = $this->createUserWithRole(Role::STAFF);
        $tutor = $this->createUserWithRole(Role::TUTOR);
        $studentOne = $this->createUserWithRole(Role::STUDENT);
        $studentTwo = $this->createUserWithRole(Role::STUDENT);

        TutorAssignment::query()->create([
            'tutor_user_id' => $tutor->id,
            'student_user_id' => $studentOne->id,
            'start_date' => now()->subDays(3)->toDateString(),
            'end_date' => now()->addDays(3)->toDateString(),
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        Sanctum::actingAs($staff);

        $response = $this->getJson('/api/analytics');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'lastLoginAt',
                'displayName',
                'welcomeSubtitle',
                'totalStudents',
                'studentsWithoutTutor',
                'noInteractionStudents7PlusDays',
                'noInteractionStudents28PlusDays',
                'messageByTutorLast7Days',
                'tuteesPerTutor',
                'mostActiveUsers' => [
                    '*' => [
                        'userId',
                        'userUuid',
                        'userName',
                        'role',
                        'loginCount',
                        'messagesSent',
                        'lastActive',
                    ],
                ],
                'recentAllocations',
                'latestBlogs',
                'mostViewedPages',
                'browsersUsed',
            ])
            ->assertJsonPath('totalStudents', 2)
            ->assertJsonPath('studentsWithoutTutor', 1)
            ->assertJsonPath('noInteractionStudents7PlusDays', 2)
            ->assertJsonPath('noInteractionStudents28PlusDays', 2);

        $payload = $response->json();
        $this->assertArrayNotHasKey('personalTutor', $payload);
        $this->assertArrayNotHasKey('assignedStudents', $payload);
        $this->assertArrayNotHasKey('totalTutors', $payload);
        $this->assertArrayNotHasKey('activeTutorAssignments', $payload);
        $this->assertArrayNotHasKey('upcomingMeetings', $payload);
        $this->assertArrayNotHasKey('upcomingMeeting', $payload);
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

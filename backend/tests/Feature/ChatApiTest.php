<?php

namespace Tests\Feature;

use App\Events\MessageSeen;
use App\Models\Conversation;
use App\Models\ConversationMember;
use App\Models\Message;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_member_can_mark_latest_incoming_message_as_seen(): void
    {
        [$tutor, $student] = $this->createTutorStudentPair();
        $conversation = $this->createConversation($tutor, $student);

        $incomingMessage = Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $tutor->id,
            'content' => 'Please review chapter 3.',
        ]);
        Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $student->id,
            'content' => 'I will do that.',
        ]);

        Event::fake([MessageSeen::class]);
        Sanctum::actingAs($student);

        $response = $this->postJson('/api/chat/' . $conversation->id . '/seen');

        $response
            ->assertOk()
            ->assertJsonFragment([
                'conversation_id' => $conversation->id,
                'user_id' => $student->id,
                'last_seen_message_id' => $incomingMessage->id,
            ]);

        $this->assertDatabaseHas('conversation_members', [
            'conversation_id' => $conversation->id,
            'user_id' => $student->id,
            'last_seen_message_id' => $incomingMessage->id,
        ]);

        Event::assertDispatched(MessageSeen::class, function (MessageSeen $event) use ($conversation, $incomingMessage, $student): bool {
            return $event->conversationId === $conversation->id
                && $event->userId === $student->id
                && $event->lastSeenMessageId === $incomingMessage->id
                && $event->seenAt !== null;
        });
    }

    public function test_mark_seen_does_not_broadcast_when_there_is_no_new_incoming_message(): void
    {
        [$tutor, $student] = $this->createTutorStudentPair();
        $conversation = $this->createConversation($tutor, $student);
        $incomingMessage = Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $tutor->id,
            'content' => 'First message.',
        ]);

        ConversationMember::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $student->id)
            ->update([
                'last_seen_message_id' => $incomingMessage->id,
                'last_seen_at' => now(),
            ]);

        Event::fake([MessageSeen::class]);
        Sanctum::actingAs($student);

        $response = $this->postJson('/api/chat/' . $conversation->id . '/seen');

        $response
            ->assertOk()
            ->assertJsonFragment([
                'conversation_id' => $conversation->id,
                'user_id' => $student->id,
                'last_seen_message_id' => $incomingMessage->id,
            ]);

        Event::assertNotDispatched(MessageSeen::class);
    }

    public function test_non_member_cannot_mark_conversation_seen(): void
    {
        [$tutor, $student] = $this->createTutorStudentPair();
        $outsider = $this->createUserWithRole(Role::STAFF);
        $conversation = $this->createConversation($tutor, $student);

        Sanctum::actingAs($outsider);

        $response = $this->postJson('/api/chat/' . $conversation->id . '/seen');

        $response->assertForbidden();
    }

    public function test_list_conversations_includes_seen_receipt_fields(): void
    {
        [$tutor, $student] = $this->createTutorStudentPair();
        $conversation = $this->createConversation($tutor, $student);

        $incomingMessage = Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $tutor->id,
            'content' => 'Message to student.',
        ]);
        $studentReply = Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $student->id,
            'content' => 'Student reply.',
        ]);

        ConversationMember::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $student->id)
            ->update([
                'last_seen_message_id' => $incomingMessage->id,
                'last_seen_at' => now(),
            ]);

        ConversationMember::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $tutor->id)
            ->update([
                'last_seen_message_id' => $studentReply->id,
                'last_seen_at' => now(),
            ]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/chat');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.current_user_last_seen_message_id', $incomingMessage->id)
            ->assertJsonPath('data.0.other_user_last_seen_message_id', $studentReply->id);
    }

    /**
     * @return array{0: User, 1: User}
     */
    private function createTutorStudentPair(): array
    {
        return [
            $this->createUserWithRole(Role::TUTOR),
            $this->createUserWithRole(Role::STUDENT),
        ];
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

    private function createConversation(User $firstUser, User $secondUser): Conversation
    {
        $conversation = Conversation::query()->create([
            'created_by_user_id' => $firstUser->id,
            'direct_pair_key' => $this->buildDirectPairKey($firstUser->id, $secondUser->id),
        ]);

        $conversation->members()->createMany([
            ['user_id' => $firstUser->id],
            ['user_id' => $secondUser->id],
        ]);

        return $conversation;
    }

    private function buildDirectPairKey(int $firstUserId, int $secondUserId): string
    {
        $orderedIds = [$firstUserId, $secondUserId];
        sort($orderedIds, SORT_NUMERIC);

        return sprintf('%d:%d', $orderedIds[0], $orderedIds[1]);
    }
}

<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Events\MessageSeen;
use App\Models\Conversation;
use App\Models\ConversationMember;
use App\Models\Document;
use App\Models\Message;
use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use App\Notifications\SharedDocumentCommentAddedNotification;
use App\Notifications\SharedDocumentUploadedNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\Events\BroadcastNotificationCreated;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
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

    public function test_tutor_can_search_any_active_user(): void
    {
        $tutor = $this->createUserWithRole(Role::TUTOR, [
            'name' => 'Tutor Owner',
        ]);
        $otherTutor = $this->createUserWithRole(Role::TUTOR, [
            'name' => 'Jordan Tutor',
        ]);
        $staff = $this->createUserWithRole(Role::STAFF, [
            'name' => 'Jordan Staff',
        ]);
        $student = $this->createUserWithRole(Role::STUDENT, [
            'name' => 'Jordan Student',
        ]);

        Sanctum::actingAs($tutor);

        $response = $this->getJson('/api/chat/search?search=Jordan');

        $response
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonFragment([
                'id' => $otherTutor->id,
                'name' => 'Jordan Tutor',
                'role_code' => Role::TUTOR,
            ])
            ->assertJsonFragment([
                'id' => $staff->id,
                'name' => 'Jordan Staff',
                'role_code' => Role::STAFF,
            ])
            ->assertJsonFragment([
                'id' => $student->id,
                'name' => 'Jordan Student',
                'role_code' => Role::STUDENT,
            ]);
    }

    public function test_tutor_can_start_conversation_with_other_tutor(): void
    {
        $tutor = $this->createUserWithRole(Role::TUTOR);
        $otherTutor = $this->createUserWithRole(Role::TUTOR);

        Sanctum::actingAs($tutor);

        $response = $this->postJson('/api/chat/conversations', [
            'target_user_id' => $otherTutor->id,
        ]);

        $response
            ->assertOk()
            ->assertJsonFragment([
                'id' => $tutor->id,
            ])
            ->assertJsonFragment([
                'id' => $otherTutor->id,
            ]);

        $conversationId = $response->json('id');

        $this->assertDatabaseHas('conversation_members', [
            'conversation_id' => $conversationId,
            'user_id' => $tutor->id,
        ]);
        $this->assertDatabaseHas('conversation_members', [
            'conversation_id' => $conversationId,
            'user_id' => $otherTutor->id,
        ]);
    }

    public function test_student_search_only_returns_assigned_tutor(): void
    {
        $student = $this->createUserWithRole(Role::STUDENT, [
            'name' => 'Student Owner',
        ]);
        $assignedTutor = $this->createUserWithRole(Role::TUTOR, [
            'name' => 'Taylor Match',
        ]);
        $unassignedTutor = $this->createUserWithRole(Role::TUTOR, [
            'name' => 'Taylor Other',
        ]);
        $staff = $this->createUserWithRole(Role::STAFF, [
            'name' => 'Taylor Staff',
        ]);

        $this->createTutorAssignment($assignedTutor, $student);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/chat/search?search=Taylor');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'id' => $assignedTutor->id,
                'name' => 'Taylor Match',
                'role_code' => Role::TUTOR,
            ])
            ->assertJsonMissing([
                'id' => $unassignedTutor->id,
            ])
            ->assertJsonMissing([
                'id' => $staff->id,
            ]);
    }

    public function test_student_can_only_start_conversation_with_assigned_tutor(): void
    {
        $student = $this->createUserWithRole(Role::STUDENT);
        $assignedTutor = $this->createUserWithRole(Role::TUTOR);
        $unassignedTutor = $this->createUserWithRole(Role::TUTOR);
        $staff = $this->createUserWithRole(Role::STAFF);

        $this->createTutorAssignment($assignedTutor, $student);

        Sanctum::actingAs($student);

        $this->postJson('/api/chat/conversations', [
            'target_user_id' => $assignedTutor->id,
        ])->assertOk();

        $this->postJson('/api/chat/conversations', [
            'target_user_id' => $unassignedTutor->id,
        ])->assertForbidden();

        $this->postJson('/api/chat/conversations', [
            'target_user_id' => $staff->id,
        ])->assertForbidden();
    }

    public function test_add_document_comment_response_includes_conversation_id(): void
    {
        [$tutor, $student] = $this->createTutorStudentPair();
        $conversation = $this->createConversation($tutor, $student);
        $document = $this->createDocument($conversation, $tutor);

        Sanctum::actingAs($student);

        $response = $this->postJson('/api/chat/documents/' . $document->id . '/comments', [
            'comment' => 'Please update the exercise notes.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonFragment([
                'document_id' => $document->id,
                'conversation_id' => $conversation->id,
                'comment' => 'Please update the exercise notes.',
            ]);
    }

    public function test_sending_message_creates_new_message_notification_for_other_member(): void
    {
        [$tutor, $student] = $this->createTutorStudentPair();
        $conversation = $this->createConversation($tutor, $student);

        Event::fake([BroadcastNotificationCreated::class, MessageSent::class]);
        Sanctum::actingAs($student);

        $response = $this->postJson('/api/chat/' . $conversation->id . '/messages', [
            'content' => 'Hello tutor, are you free tomorrow?',
        ]);

        $response
            ->assertOk()
            ->assertJsonFragment([
                'conversation_id' => $conversation->id,
                'sender_id' => $student->id,
            ]);

        $this->assertDatabaseCount('notifications', 1);

        $notification = $tutor->fresh()->notifications()->firstOrFail();

        $this->assertSame(\App\Notifications\NewMessage::class, $notification->type);
        $this->assertSame('New Message', $notification->data['title'] ?? null);
        $this->assertSame($conversation->id, $notification->data['conversation_id'] ?? null);
        $this->assertSame($student->name . ' sent you a message.', $notification->data['body'] ?? null);
        $this->assertSame(0, $student->fresh()->notifications()->count());

        Event::assertDispatched(BroadcastNotificationCreated::class);
    }

    public function test_uploading_shared_document_notifies_other_conversation_member(): void
    {
        [$tutor, $student] = $this->createTutorStudentPair();
        $conversation = $this->createConversation($tutor, $student);

        Storage::fake('public');
        Event::fake([BroadcastNotificationCreated::class]);
        Sanctum::actingAs($student);

        $response = $this->postJson('/api/chat/' . $conversation->id . '/documents', [
            'file' => UploadedFile::fake()->create('cw-draft.pdf', 256, 'application/pdf'),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('conversation_id', $conversation->id)
            ->assertJsonPath('file_name', 'cw-draft.pdf');

        $this->assertDatabaseCount('notifications', 1);

        $notification = $tutor->fresh()->notifications()->firstOrFail();

        $this->assertSame(SharedDocumentUploadedNotification::class, $notification->type);
        $this->assertSame('New Shared Document', $notification->data['title'] ?? null);
        $this->assertSame($student->name . ' uploaded "cw-draft.pdf" for review.', $notification->data['body'] ?? null);
        $this->assertSame('/communication-hub', $notification->data['action']['route'] ?? null);
        $this->assertSame($conversation->id, $notification->data['action']['query']['conversation'] ?? null);
        $this->assertSame($response->json('id'), $notification->data['action']['query']['document'] ?? null);
        $this->assertSame(0, $student->fresh()->notifications()->count());

        Event::assertDispatched(BroadcastNotificationCreated::class);
    }

    public function test_adding_document_comment_notifies_other_conversation_member(): void
    {
        [$tutor, $student] = $this->createTutorStudentPair();
        $conversation = $this->createConversation($tutor, $student);
        $document = $this->createDocument($conversation, $tutor);

        Event::fake([BroadcastNotificationCreated::class]);
        Sanctum::actingAs($student);

        $response = $this->postJson('/api/chat/documents/' . $document->id . '/comments', [
            'comment' => 'Please revise section 2 before tomorrow.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('document_id', $document->id)
            ->assertJsonPath('conversation_id', $conversation->id);

        $this->assertDatabaseCount('notifications', 1);

        $notification = $tutor->fresh()->notifications()->firstOrFail();

        $this->assertSame(SharedDocumentCommentAddedNotification::class, $notification->type);
        $this->assertSame('New Document Comment', $notification->data['title'] ?? null);
        $this->assertSame($student->name . ' commented on "lesson-notes.pdf".', $notification->data['body'] ?? null);
        $this->assertSame('/communication-hub', $notification->data['action']['route'] ?? null);
        $this->assertSame($conversation->id, $notification->data['action']['query']['conversation'] ?? null);
        $this->assertSame($document->id, $notification->data['action']['query']['document'] ?? null);
        $this->assertSame($response->json('id'), $notification->data['action']['query']['comment'] ?? null);
        $this->assertSame(0, $student->fresh()->notifications()->count());

        Event::assertDispatched(BroadcastNotificationCreated::class);
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

    private function createUserWithRole(string $roleCode, array $attributes = []): User
    {
        $user = User::factory()->create([
            'is_active' => true,
            ...$attributes,
        ]);

        $roleId = Role::query()
            ->where('code', $roleCode)
            ->value('id');

        $user->update([
            'role_id' => $roleId,
        ]);

        return $user->load('role');
    }

    private function createTutorAssignment(User $tutor, User $student): TutorAssignment
    {
        return TutorAssignment::query()->create([
            'tutor_user_id' => $tutor->id,
            'student_user_id' => $student->id,
            'start_date' => now()->subDay()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);
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

    private function createDocument(Conversation $conversation, User $uploader): Document
    {
        return Document::query()->create([
            'conversation_id' => $conversation->id,
            'uploaded_by_user_id' => $uploader->id,
            'file_name' => 'lesson-notes.pdf',
            'file_path' => 'chat-documents/lesson-notes.pdf',
            'file_size_bytes' => 1024,
            'mime_type' => 'application/pdf',
        ]);
    }

    private function buildDirectPairKey(int $firstUserId, int $secondUserId): string
    {
        $orderedIds = [$firstUserId, $secondUserId];
        sort($orderedIds, SORT_NUMERIC);

        return sprintf('%d:%d', $orderedIds[0], $orderedIds[1]);
    }
}

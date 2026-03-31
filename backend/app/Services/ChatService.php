<?php

namespace App\Services;

use App\Events\DocumentCommentAdded;
use App\Events\DocumentShared;
use App\Events\MessageSent;
use App\Events\MessageSeen;
use App\Models\Conversation;
use App\Models\ConversationMember;
use App\Models\Document;
use App\Models\DocumentComment;
use App\Models\Message;
use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use App\Notifications\NewMessage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ChatService
{
    public const DEFAULT_PER_PAGE = 15;

    public const MAX_PER_PAGE = 100;

    public const DEFAULT_ASSIGNMENT_WELCOME_MESSAGE = 'Welcome! This conversation has been created for your tutor assignment. Feel free to introduce yourselves and plan your first session.';

    public function sanitizePerPage(int $perPage): int
    {
        return max(1, min(self::MAX_PER_PAGE, $perPage));
    }

    public function listConversations(User $user, int $perPage): LengthAwarePaginator
    {
        $perPage = $this->sanitizePerPage($perPage);

        return Conversation::query()
            ->whereHas('members', function (Builder $query) use ($user): void {
                $query->where('user_id', $user->id);
            })
            ->with([
                'members.user:id,name,email',
                'members.user.role:id,code,name',
                'latestMessage.sender:id,name',
            ])
            ->orderByRaw('COALESCE(last_message_at, created_at) DESC')
            ->paginate($perPage);
    }

    public function searchChatUsers(User $user, string $term, int $perPage): LengthAwarePaginator
    {
        $perPage = $this->sanitizePerPage($perPage);
        $term = trim($term);
        $allowedUserIds = $this->allowedChatUserIds($user);

        $query = User::query()
            ->where('is_active', true)
            ->whereKeyNot($user->id)
            ->where(function (Builder $builder) use ($term): void {
                $builder->where('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%");
            })
            ->with('role:id,code,name');

        if ($allowedUserIds !== null) {
            if ($allowedUserIds === []) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('id', $allowedUserIds);
            }
        }

        return $query
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function createOrGetConversation(User $user, User $target): Conversation
    {
        $this->ensureCanStartConversation($user, $target);

        return $this->createOrGetDirectConversation($user, $target, $user);
    }

    public function createOrGetDirectConversation(
        User $firstUser,
        User $secondUser,
        ?User $creator = null
    ): Conversation {
        return $this->createOrGetDirectConversationByIds(
            (int) $firstUser->id,
            (int) $secondUser->id,
            $creator?->id ?? $firstUser->id,
        );
    }

    public function ensureAssignmentWelcomeConversation(TutorAssignment $assignment): bool
    {
        $assignment->loadMissing([
            'tutor:id',
            'student:id',
        ]);

        if (! $assignment->tutor instanceof User || ! $assignment->student instanceof User) {
            return false;
        }

        $conversation = $this->createOrGetDirectConversation(
            $assignment->tutor,
            $assignment->student,
            $assignment->tutor,
        );

        if ($conversation->messages()->exists()) {
            return false;
        }

        $this->sendSystemMessage($conversation, self::DEFAULT_ASSIGNMENT_WELCOME_MESSAGE);

        return true;
    }

    public function listMessages(User $user, Conversation $conversation, int $perPage): LengthAwarePaginator
    {
        $this->ensureConversationMember($user, $conversation);

        $perPage = $this->sanitizePerPage($perPage);

        return Message::query()
            ->where('conversation_id', $conversation->id)
            ->with('sender:id,name')
            ->latest('id')
            ->paginate($perPage);
    }

    public function sendMessage(User $user, Conversation $conversation, string $content): Message
    {
        $this->ensureConversationMember($user, $conversation);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => $user->id,
            'content' => $content,
        ]);

        $conversation->update([
            'last_message_at' => $message->created_at,
        ]);

        $message->loadMissing('sender:id,name');
        $this->notifyConversationRecipients($conversation, $user, $message);

        MessageSent::dispatch($message);

        return $message;
    }

    public function sendSystemMessage(Conversation $conversation, string $content): Message
    {
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_user_id' => null,
            'content' => $content,
        ]);

        $conversation->update([
            'last_message_at' => $message->created_at,
        ]);

        MessageSent::dispatch($message);

        return $message;
    }

    public function listSharedDocuments(User $user, Conversation $conversation, int $perPage): LengthAwarePaginator
    {
        $this->ensureConversationMember($user, $conversation);

        $perPage = $this->sanitizePerPage($perPage);

        return Document::query()
            ->where('conversation_id', $conversation->id)
            ->with('uploader:id,name')
            ->withCount('comments')
            ->latest('id')
            ->paginate($perPage);
    }

    public function uploadSharedDocument(User $user, Conversation $conversation, UploadedFile $file): Document
    {
        $this->ensureConversationMember($user, $conversation);

        $filePath = $file->store('chat-documents', 'public');

        $document = Document::query()->create([
            'conversation_id' => $conversation->id,
            'uploaded_by_user_id' => $user->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'file_size_bytes' => $file->getSize() ?? 0,
            'mime_type' => $file->getClientMimeType() ?? 'application/octet-stream',
        ]);

        $document
            ->loadMissing('uploader:id,name')
            ->loadCount('comments');

        DocumentShared::dispatch($document);

        return $document;
    }

    public function listDocumentComments(User $user, Document $document, int $perPage): LengthAwarePaginator
    {
        $this->ensureDocumentConversationMember($user, $document);

        $perPage = $this->sanitizePerPage($perPage);

        return DocumentComment::query()
            ->where('document_id', $document->id)
            ->with('commenter:id,name')
            ->oldest('id')
            ->paginate($perPage);
    }

    public function addDocumentComment(User $user, Document $document, string $comment): DocumentComment
    {
        $this->ensureDocumentConversationMember($user, $document);

        $commentModel = DocumentComment::query()->create([
            'document_id' => $document->id,
            'commenter_user_id' => $user->id,
            'comment' => $comment,
        ]);

        $commentModel->loadMissing([
            'commenter:id,name',
            'document:id,conversation_id',
        ]);

        DocumentCommentAdded::dispatch($commentModel);

        return $commentModel;
    }

    public function markConversationSeen(User $user, Conversation $conversation): ConversationMember
    {
        $member = $this->ensureConversationMember($user, $conversation);

        $latestIncomingMessageId = Message::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_user_id', '!=', $user->id)
            ->max('id');

        if (! is_numeric($latestIncomingMessageId)) {
            return $member;
        }

        $latestIncomingMessageId = (int) $latestIncomingMessageId;
        $currentLastSeenMessageId = (int) ($member->last_seen_message_id ?? 0);

        if ($currentLastSeenMessageId >= $latestIncomingMessageId) {
            return $member;
        }

        $member->forceFill([
            'last_seen_message_id' => $latestIncomingMessageId,
            'last_seen_at' => now(),
        ])->save();

        $member->refresh();

        MessageSeen::dispatch(
            (int) $conversation->id,
            (int) $user->id,
            (int) $member->last_seen_message_id,
            $member->last_seen_at?->toISOString(),
        );

        return $member;
    }

    private function allowedChatUserIds(User $user): ?array
    {
        if ($this->canChatAnyActiveUser($user)) {
            return null;
        }

        if ($user->hasRole(Role::STUDENT)) {
            return TutorAssignment::query()
                ->where('student_user_id', $user->id)
                ->whereNotNull('tutor_user_id')
                ->pluck('tutor_user_id')
                ->unique()
                ->values()
                ->all();
        }

        return [];
    }

    private function ensureCanStartConversation(User $user, User $target): void
    {
        if ((int) $user->id === (int) $target->id) {
            throw new UnprocessableEntityHttpException('You cannot start a conversation with yourself.');
        }

        if (! $target->is_active) {
            throw new AccessDeniedHttpException('You cannot start a conversation with this user.');
        }

        if (! $this->canStartConversation($user, $target)) {
            throw new AccessDeniedHttpException('You cannot start a conversation with this user.');
        }
    }

    private function canStartConversation(User $user, User $target): bool
    {
        if ($this->canChatAnyActiveUser($user)) {
            return true;
        }

        if ($user->hasRole(Role::STUDENT)) {
            return $target->hasRole(Role::TUTOR)
                && $this->hasTutorAssignment((int) $target->id, (int) $user->id);
        }

        return false;
    }

    private function hasTutorAssignment(int $tutorUserId, int $studentUserId): bool
    {
        return TutorAssignment::query()
            ->where('tutor_user_id', $tutorUserId)
            ->where('student_user_id', $studentUserId)
            ->exists();
    }

    private function canChatAnyActiveUser(User $user): bool
    {
        return $user->hasAnyRole([Role::ADMIN, Role::STAFF, Role::TUTOR]);
    }

    private function ensureDirectConversationMembers(Conversation $conversation, User $user, User $target): void
    {
        $this->ensureDirectConversationMembersByIds(
            $conversation,
            (int) $user->id,
            (int) $target->id,
        );
    }

    private function ensureDirectConversationMembersByIds(
        Conversation $conversation,
        int $firstUserId,
        int $secondUserId
    ): void {
        ConversationMember::query()->firstOrCreate([
            'conversation_id' => $conversation->id,
            'user_id' => $firstUserId,
        ]);
        ConversationMember::query()->firstOrCreate([
            'conversation_id' => $conversation->id,
            'user_id' => $secondUserId,
        ]);
    }

    private function ensureConversationMember(User $user, Conversation $conversation): ConversationMember
    {
        return $this->ensureConversationIdMember($user, (int) $conversation->id);
    }

    private function ensureDocumentConversationMember(User $user, Document $document): ConversationMember
    {
        return $this->ensureConversationIdMember($user, (int) $document->conversation_id);
    }

    private function ensureConversationIdMember(User $user, int $conversationId): ConversationMember
    {
        $member = ConversationMember::query()
            ->where('conversation_id', $conversationId)
            ->where('user_id', $user->id)
            ->first();

        if (! $member instanceof ConversationMember) {
            throw new AccessDeniedHttpException('You are not a member of this conversation.');
        }

        return $member;
    }

    private function notifyConversationRecipients(Conversation $conversation, User $sender, Message $message): void
    {
        User::query()
            ->whereHas('conversationMembers', function (Builder $query) use ($conversation): void {
                $query->where('conversation_id', $conversation->id);
            })
            ->whereKeyNot($sender->id)
            ->get()
            ->each(fn(User $recipient) => $recipient->notify(new NewMessage($message)));
    }

    private function buildDirectPairKey(int $firstUserId, int $secondUserId): string
    {
        $orderedIds = [$firstUserId, $secondUserId];
        sort($orderedIds, SORT_NUMERIC);

        return sprintf('%d:%d', $orderedIds[0], $orderedIds[1]);
    }

    private function createOrGetDirectConversationByIds(
        int $firstUserId,
        int $secondUserId,
        int $creatorUserId
    ): Conversation {
        $pairKey = $this->buildDirectPairKey($firstUserId, $secondUserId);
        $existingConversation = Conversation::query()
            ->where('direct_pair_key', $pairKey)
            ->first();

        if ($existingConversation instanceof Conversation) {
            $this->ensureDirectConversationMembersByIds(
                $existingConversation,
                $firstUserId,
                $secondUserId,
            );

            return $existingConversation->load([
                'members.user.role:id,code,name',
                'latestMessage.sender:id,name',
            ]);
        }

        return DB::transaction(function () use ($creatorUserId, $firstUserId, $pairKey, $secondUserId): Conversation {
            $conversation = Conversation::query()->create([
                'created_by_user_id' => $creatorUserId,
                'direct_pair_key' => $pairKey,
            ]);

            $conversation->members()->createMany([
                ['user_id' => $firstUserId],
                ['user_id' => $secondUserId],
            ]);

            return $conversation->load([
                'members.user.role:id,code,name',
                'latestMessage.sender:id,name',
            ]);
        });
    }
}

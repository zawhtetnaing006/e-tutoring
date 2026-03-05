<?php

namespace App\Services;

use App\Models\ClassRoom;
use App\Models\ClassRoomMessage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ChatService
{
    public const DEFAULT_PER_PAGE = 15;

    public const MAX_PER_PAGE = 100;

    public function sanitizePerPage(int $perPage): int
    {
        return max(1, min(self::MAX_PER_PAGE, $perPage));
    }

    public function listConversations(int $userId, int $perPage): LengthAwarePaginator
    {
        $perPage = $this->sanitizePerPage($perPage);

        return ClassRoom::query()
            ->where(function ($query) use ($userId): void {
                $query->where('tutor_user_id', $userId)
                    ->orWhere('student_user_id', $userId);
            })
            ->with([
                'tutor:id,name',
                'student:id,name',
                'messages' => function ($query): void {
                    $query->latest('id')->limit(1)->with('sender:id,name');
                },
            ])
            ->latest('updated_at')
            ->paginate($perPage);
    }

    public function listMessages(int $userId, ClassRoom $conversation, int $perPage): LengthAwarePaginator
    {
        $this->ensureClassRoomMember($userId, $conversation);

        $perPage = $this->sanitizePerPage($perPage);

        return ClassRoomMessage::query()
            ->where('class_id', $conversation->id)
            ->with('sender:id,name')
            ->latest('id')
            ->paginate($perPage);
    }

    public function sendMessage(int $userId, ClassRoom $conversation, string $content): ClassRoomMessage
    {
        $this->ensureClassRoomMember($userId, $conversation);

        $message = ClassRoomMessage::create([
            'class_id' => $conversation->id,
            'sender_user_id' => $userId,
            'content' => $content,
        ]);

        $conversation->touch();

        return $message->loadMissing('sender:id,name');
    }

    private function ensureClassRoomMember(int $userId, ClassRoom $conversation): void
    {
        $isMember = $conversation->tutor_user_id === $userId || $conversation->student_user_id === $userId;

        if (! $isMember) {
            throw new AccessDeniedHttpException('You are not a member of this conversation.');
        }
    }
}

<?php

namespace App\Services;

use App\Models\TutorAssignment;
use App\Models\TutorAssignmentMessage;
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

        return TutorAssignment::query()
            ->where(function ($query) use ($userId): void {
                $query->where('tutor_user_id', $userId)
                    ->orWhere('student_user_id', $userId);
            })
            ->with([
                'tutor:id,name',
                'student:id,name',
                'latestMessage.sender:id,name',
            ])
            ->latest('updated_at')
            ->paginate($perPage);
    }

    public function listMessages(int $userId, TutorAssignment $conversation, int $perPage): LengthAwarePaginator
    {
        $this->ensureTutorAssignmentMember($userId, $conversation);

        $perPage = $this->sanitizePerPage($perPage);

        return TutorAssignmentMessage::query()
            ->where('tutor_assignment_id', $conversation->id)
            ->with('sender:id,name')
            ->latest('id')
            ->paginate($perPage);
    }

    public function sendMessage(int $userId, TutorAssignment $conversation, string $content): TutorAssignmentMessage
    {
        $this->ensureTutorAssignmentMember($userId, $conversation);

        $message = TutorAssignmentMessage::create([
            'tutor_assignment_id' => $conversation->id,
            'sender_user_id' => $userId,
            'content' => $content,
        ]);

        $conversation->touch();

        return $message->loadMissing('sender:id,name');
    }

    private function ensureTutorAssignmentMember(int $userId, TutorAssignment $conversation): void
    {
        $isMember = $conversation->tutor_user_id === $userId || $conversation->student_user_id === $userId;

        if (! $isMember) {
            throw new AccessDeniedHttpException('You are not a member of this conversation.');
        }
    }
}

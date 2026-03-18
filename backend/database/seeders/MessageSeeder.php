<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class MessageSeeder extends Seeder
{
    /**
     * Seed chat messages and seen state for the communication hub.
     */
    public function run(): void
    {
        $conversations = Conversation::query()
            ->with(['members.user.role'])
            ->orderBy('id')
            ->get();

        foreach ($conversations as $conversation) {
            $participants = $conversation->members
                ->pluck('user')
                ->filter(fn ($user): bool => $user instanceof User)
                ->sortBy('id')
                ->values();

            if ($participants->count() < 2) {
                continue;
            }

            /** @var User $firstUser */
            $firstUser = $participants[0];
            /** @var User $secondUser */
            $secondUser = $participants[1];

            $messages = $this->seedMessages(
                $conversation,
                $this->buildMessageData($firstUser, $secondUser)
            );

            $this->updateSeenState($conversation, [
                $firstUser->id => $messages[max(count($messages) - 2, 0)]->id ?? null,
                $secondUser->id => $messages[count($messages) - 1]->id ?? null,
            ]);
        }
    }

    /**
     * @param  list<array{0: User, 1: string}>  $messageData
     * @return list<Message>
     */
    private function seedMessages(Conversation $conversation, array $messageData): array
    {
        $messages = [];

        foreach ($messageData as [$sender, $content]) {
            $messages[] = Message::create([
                'conversation_id' => $conversation->id,
                'sender_user_id' => $sender->id,
                'content' => $content,
            ]);
        }

        $latestMessage = collect($messages)->sortByDesc('id')->first();

        $conversation->update([
            'last_message_at' => $latestMessage?->created_at,
        ]);

        return $messages;
    }

    /**
     * @param  array<int, int|null>  $lastSeenMessageIdsByUserId
     */
    private function updateSeenState(Conversation $conversation, array $lastSeenMessageIdsByUserId): void
    {
        $conversation->members()->get()->each(function ($member) use ($lastSeenMessageIdsByUserId): void {
            $lastSeenMessageId = $lastSeenMessageIdsByUserId[$member->user_id] ?? null;

            $member->update([
                'last_seen_message_id' => $lastSeenMessageId,
                'last_seen_at' => $lastSeenMessageId === null ? null : now(),
            ]);
        });
    }

    /**
     * @return list<array{0: User, 1: string}>
     */
    private function buildMessageData(User $firstUser, User $secondUser): array
    {
        $firstRole = strtoupper((string) $firstUser->role?->code);
        $secondRole = strtoupper((string) $secondUser->role?->code);

        if ($this->matchesRolePair($firstRole, $secondRole, Role::TUTOR, Role::STUDENT)) {
            $tutor = $firstRole === Role::TUTOR ? $firstUser : $secondUser;
            $student = $firstRole === Role::STUDENT ? $firstUser : $secondUser;

            return [
                [$tutor, 'Hi, let us focus on the key topics for this week.'],
                [$student, 'That works for me. I still need help with the last exercise set.'],
                [$tutor, 'Send me your notes before the session and I will review them first.'],
                [$student, 'I will send them tonight so we can go through them tomorrow.'],
            ];
        }

        if ($this->matchesRolePair($firstRole, $secondRole, Role::STAFF, Role::TUTOR)) {
            $staff = $firstRole === Role::STAFF ? $firstUser : $secondUser;
            $tutor = $firstRole === Role::TUTOR ? $firstUser : $secondUser;

            return [
                [$staff, 'Please share your weekly tutoring update this afternoon.'],
                [$tutor, 'Understood. I will include attendance and progress notes.'],
                [$staff, 'Thanks. Please flag any students who may need extra support.'],
            ];
        }

        return [
            [$firstUser, 'Can we align on the next steps before the next session?'],
            [$secondUser, 'Yes. I will review the materials and send over any questions first.'],
            [$firstUser, 'Good. That will make the discussion much more focused.'],
        ];
    }

    private function matchesRolePair(
        string $firstRole,
        string $secondRole,
        string $expectedRoleOne,
        string $expectedRoleTwo
    ): bool {
        return ($firstRole === $expectedRoleOne && $secondRole === $expectedRoleTwo)
            || ($firstRole === $expectedRoleTwo && $secondRole === $expectedRoleOne);
    }
}

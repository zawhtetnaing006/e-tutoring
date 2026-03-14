<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;

class MessageSeeder extends Seeder
{
    /**
     * Seed chat messages and seen state for the communication hub.
     */
    public function run(): void
    {
        $threads = [
            [
                'first_user_email' => UserSeeder::LINKED_TUTOR_EMAIL,
                'second_user_email' => UserSeeder::LINKED_STUDENT_EMAIL,
                'messages' => [
                    ['sender_email' => UserSeeder::LINKED_TUTOR_EMAIL, 'content' => 'Hi, let us focus on chapter 3 this week.'],
                    ['sender_email' => UserSeeder::LINKED_STUDENT_EMAIL, 'content' => 'Sounds good. I struggled with the last exercise.'],
                    ['sender_email' => UserSeeder::LINKED_TUTOR_EMAIL, 'content' => 'Send me your notes before tomorrow and I will review them.'],
                    ['sender_email' => UserSeeder::LINKED_STUDENT_EMAIL, 'content' => 'I will send them tonight after class.'],
                ],
                'last_seen_indexes' => [
                    UserSeeder::LINKED_TUTOR_EMAIL => 2,
                    UserSeeder::LINKED_STUDENT_EMAIL => 1,
                ],
            ],
            [
                'first_user_email' => UserSeeder::LINKED_STAFF_EMAIL,
                'second_user_email' => UserSeeder::LINKED_TUTOR_EMAIL,
                'messages' => [
                    ['sender_email' => UserSeeder::LINKED_STAFF_EMAIL, 'content' => 'Please send the monthly progress summary this afternoon.'],
                    ['sender_email' => UserSeeder::LINKED_TUTOR_EMAIL, 'content' => 'Understood. I will send it after the last session today.'],
                    ['sender_email' => UserSeeder::LINKED_STAFF_EMAIL, 'content' => 'Thanks. Include the attendance trend as well.'],
                ],
                'last_seen_indexes' => [
                    UserSeeder::LINKED_STAFF_EMAIL => 2,
                    UserSeeder::LINKED_TUTOR_EMAIL => 2,
                ],
            ],
            [
                'first_user_email' => 'alicia.morgan@greenwich.ac.uk',
                'second_user_email' => 'ava.collins@greenwich.ac.uk',
                'messages' => [
                    ['sender_email' => 'alicia.morgan@greenwich.ac.uk', 'content' => 'Bring your draft introduction tomorrow and we will tighten the structure.'],
                    ['sender_email' => 'ava.collins@greenwich.ac.uk', 'content' => 'Will do. I also want help with paragraph transitions.'],
                    ['sender_email' => 'alicia.morgan@greenwich.ac.uk', 'content' => 'Perfect. We can review topic sentences first.'],
                ],
                'last_seen_indexes' => [
                    'alicia.morgan@greenwich.ac.uk' => 2,
                    'ava.collins@greenwich.ac.uk' => 2,
                ],
            ],
            [
                'first_user_email' => 'daniel.hsu@greenwich.ac.uk',
                'second_user_email' => 'benjamin.scott@greenwich.ac.uk',
                'messages' => [
                    ['sender_email' => 'benjamin.scott@greenwich.ac.uk', 'content' => 'I am still confused about probability distributions.'],
                    ['sender_email' => 'daniel.hsu@greenwich.ac.uk', 'content' => 'Start with the examples we covered and note where the assumptions change.'],
                    ['sender_email' => 'benjamin.scott@greenwich.ac.uk', 'content' => 'That helps. I will bring two examples to the next session.'],
                ],
                'last_seen_indexes' => [
                    'daniel.hsu@greenwich.ac.uk' => 1,
                    'benjamin.scott@greenwich.ac.uk' => 2,
                ],
            ],
            [
                'first_user_email' => 'mei.chen@greenwich.ac.uk',
                'second_user_email' => 'ethan.parker@greenwich.ac.uk',
                'messages' => [
                    ['sender_email' => 'ethan.parker@greenwich.ac.uk', 'content' => 'Can we spend extra time on differential equations this week?'],
                    ['sender_email' => 'mei.chen@greenwich.ac.uk', 'content' => 'Yes. Send the worksheet questions that are blocking you first.'],
                    ['sender_email' => 'ethan.parker@greenwich.ac.uk', 'content' => 'I have highlighted the three hardest ones and will upload them tonight.'],
                    ['sender_email' => 'mei.chen@greenwich.ac.uk', 'content' => 'Good. I will prepare similar practice questions as well.'],
                ],
                'last_seen_indexes' => [
                    'mei.chen@greenwich.ac.uk' => 3,
                    'ethan.parker@greenwich.ac.uk' => 2,
                ],
            ],
            [
                'first_user_email' => 'priya.nair@greenwich.ac.uk',
                'second_user_email' => 'fatima.ali@greenwich.ac.uk',
                'messages' => [
                    ['sender_email' => 'priya.nair@greenwich.ac.uk', 'content' => 'For the security lab, focus on validating every form input first.'],
                    ['sender_email' => 'fatima.ali@greenwich.ac.uk', 'content' => 'I fixed the password checks but still need help with session handling.'],
                    ['sender_email' => 'priya.nair@greenwich.ac.uk', 'content' => 'That is a good next step. We can review session expiry in the tutorial.'],
                ],
                'last_seen_indexes' => [
                    'priya.nair@greenwich.ac.uk' => 2,
                    'fatima.ali@greenwich.ac.uk' => 1,
                ],
            ],
        ];

        $usersByEmail = User::whereIn(
            'email',
            collect($threads)
                ->flatMap(
                    fn (array $thread): array => array_merge(
                        [$thread['first_user_email'], $thread['second_user_email']],
                        array_column($thread['messages'], 'sender_email')
                    )
                )
                ->unique()
                ->values()
                ->all()
        )->get()->keyBy('email');

        foreach ($threads as $thread) {
            $firstUser = $usersByEmail[$thread['first_user_email']] ?? null;
            $secondUser = $usersByEmail[$thread['second_user_email']] ?? null;

            if (! $firstUser instanceof User || ! $secondUser instanceof User) {
                continue;
            }

            $conversation = $this->findConversation($firstUser->id, $secondUser->id);

            if (! $conversation instanceof Conversation) {
                continue;
            }

            $messageData = [];

            foreach ($thread['messages'] as $message) {
                $sender = $usersByEmail[$message['sender_email']] ?? null;

                if (! $sender instanceof User) {
                    continue 2;
                }

                $messageData[] = [$sender, $message['content']];
            }

            $messages = $this->seedMessages($conversation, $messageData);

            $lastSeenMessageIdsByUserId = [];

            foreach ($thread['last_seen_indexes'] as $email => $index) {
                $user = $usersByEmail[$email] ?? null;

                if ($user instanceof User) {
                    $lastSeenMessageIdsByUserId[$user->id] = $messages[$index]->id ?? null;
                }
            }

            $this->updateSeenState($conversation, $lastSeenMessageIdsByUserId);
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

    private function findConversation(int $firstUserId, int $secondUserId): ?Conversation
    {
        return Conversation::where(
            'direct_pair_key',
            $this->buildDirectPairKey($firstUserId, $secondUserId)
        )
            ->first();
    }

    private function buildDirectPairKey(int $firstUserId, int $secondUserId): string
    {
        $orderedIds = [$firstUserId, $secondUserId];
        sort($orderedIds, SORT_NUMERIC);

        return sprintf('%d:%d', $orderedIds[0], $orderedIds[1]);
    }
}

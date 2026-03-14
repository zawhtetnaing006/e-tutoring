<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Seeder;

class ConversationSeeder extends Seeder
{
    /**
     * Seed direct conversations used by the communication hub.
     */
    public function run(): void
    {
        $conversationPairs = [
            [
                'first_user_email' => UserSeeder::LINKED_TUTOR_EMAIL,
                'second_user_email' => UserSeeder::LINKED_STUDENT_EMAIL,
                'creator_email' => UserSeeder::LINKED_TUTOR_EMAIL,
            ],
            [
                'first_user_email' => UserSeeder::LINKED_STAFF_EMAIL,
                'second_user_email' => UserSeeder::LINKED_TUTOR_EMAIL,
                'creator_email' => UserSeeder::LINKED_STAFF_EMAIL,
            ],
            [
                'first_user_email' => 'alicia.morgan@greenwich.ac.uk',
                'second_user_email' => 'ava.collins@greenwich.ac.uk',
                'creator_email' => 'alicia.morgan@greenwich.ac.uk',
            ],
            [
                'first_user_email' => 'daniel.hsu@greenwich.ac.uk',
                'second_user_email' => 'benjamin.scott@greenwich.ac.uk',
                'creator_email' => 'daniel.hsu@greenwich.ac.uk',
            ],
            [
                'first_user_email' => 'mei.chen@greenwich.ac.uk',
                'second_user_email' => 'ethan.parker@greenwich.ac.uk',
                'creator_email' => 'ethan.parker@greenwich.ac.uk',
            ],
            [
                'first_user_email' => 'priya.nair@greenwich.ac.uk',
                'second_user_email' => 'fatima.ali@greenwich.ac.uk',
                'creator_email' => 'priya.nair@greenwich.ac.uk',
            ],
            [
                'first_user_email' => UserSeeder::LINKED_STAFF_EMAIL,
                'second_user_email' => 'alicia.morgan@greenwich.ac.uk',
                'creator_email' => UserSeeder::LINKED_STAFF_EMAIL,
            ],
        ];

        $usersByEmail = User::whereIn(
            'email',
            collect($conversationPairs)
                ->flatMap(fn (array $pair): array => [
                    $pair['first_user_email'],
                    $pair['second_user_email'],
                    $pair['creator_email'],
                ])
                ->unique()
                ->values()
                ->all()
        )->get()->keyBy('email');

        foreach ($conversationPairs as $pair) {
            $firstUser = $usersByEmail[$pair['first_user_email']] ?? null;
            $secondUser = $usersByEmail[$pair['second_user_email']] ?? null;
            $creator = $usersByEmail[$pair['creator_email']] ?? null;

            if (
                $firstUser instanceof User
                && $secondUser instanceof User
                && $creator instanceof User
            ) {
                $this->seedDirectConversation($firstUser, $secondUser, $creator);
            }
        }
    }

    private function seedDirectConversation(User $firstUser, User $secondUser, User $creator): void
    {
        $pairKey = $this->buildDirectPairKey($firstUser->id, $secondUser->id);

        $conversation = Conversation::create([
            'created_by_user_id' => $creator->id,
            'direct_pair_key' => $pairKey,
        ]);

        $conversation->members()->create([
            'user_id' => $firstUser->id,
        ]);

        $conversation->members()->create([
            'user_id' => $secondUser->id,
        ]);
    }

    private function buildDirectPairKey(int $firstUserId, int $secondUserId): string
    {
        $orderedIds = [$firstUserId, $secondUserId];
        sort($orderedIds, SORT_NUMERIC);

        return sprintf('%d:%d', $orderedIds[0], $orderedIds[1]);
    }
}

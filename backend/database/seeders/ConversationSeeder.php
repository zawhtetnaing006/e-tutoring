<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class ConversationSeeder extends Seeder
{
    /**
     * Seed direct conversations used by the communication hub.
     */
    public function run(): void
    {
        $staffUsers = User::query()
            ->whereHas('role', fn ($query) => $query->where('code', Role::STAFF))
            ->orderBy('id')
            ->get()
            ->values();

        $tutorUsers = User::query()
            ->whereHas('role', fn ($query) => $query->where('code', Role::TUTOR))
            ->orderBy('id')
            ->get()
            ->values();

        $studentUsers = User::query()
            ->whereHas('role', fn ($query) => $query->where('code', Role::STUDENT))
            ->orderBy('id')
            ->get()
            ->values();

        $pairs = [];
        $seenPairKeys = [];

        $fixedStaff = $staffUsers->firstWhere('email', UserSeeder::STAFF_EMAIL);
        $fixedTutor = $tutorUsers->firstWhere('email', UserSeeder::TUTOR_EMAIL);
        $fixedStudent = $studentUsers->firstWhere('email', UserSeeder::STUDENT_EMAIL);

        $this->addConversationPair($pairs, $seenPairKeys, $fixedTutor, $fixedStudent, $fixedTutor);
        $this->addConversationPair($pairs, $seenPairKeys, $fixedStaff, $fixedTutor, $fixedStaff);

        $otherTutors = $tutorUsers
            ->reject(fn (User $user): bool => $user->email === UserSeeder::TUTOR_EMAIL)
            ->values();

        $otherStudents = $studentUsers
            ->reject(fn (User $user): bool => $user->email === UserSeeder::STUDENT_EMAIL)
            ->values();

        $otherStaff = $staffUsers
            ->reject(fn (User $user): bool => $user->email === UserSeeder::STAFF_EMAIL)
            ->values();

        $extraTutorStudentCount = min(4, $otherTutors->count(), $otherStudents->count());

        for ($index = 0; $index < $extraTutorStudentCount; $index++) {
            $this->addConversationPair(
                $pairs,
                $seenPairKeys,
                $otherTutors[$index],
                $otherStudents[$index],
                $otherTutors[$index]
            );
        }

        $extraStaffTutorCount = min(2, $otherStaff->count(), $tutorUsers->count());

        for ($index = 0; $index < $extraStaffTutorCount; $index++) {
            $this->addConversationPair(
                $pairs,
                $seenPairKeys,
                $otherStaff[$index],
                $tutorUsers[$index % $tutorUsers->count()],
                $otherStaff[$index]
            );
        }

        foreach ($pairs as [$firstUser, $secondUser, $creator]) {
            $this->seedDirectConversation($firstUser, $secondUser, $creator);
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

    /**
     * @param  array<int, array{0: User, 1: User, 2: User}>  $pairs
     * @param  array<string, bool>  $seenPairKeys
     */
    private function addConversationPair(
        array &$pairs,
        array &$seenPairKeys,
        ?User $firstUser,
        ?User $secondUser,
        ?User $creator
    ): void {
        if (! $firstUser instanceof User || ! $secondUser instanceof User || ! $creator instanceof User) {
            return;
        }

        $pairKey = $this->buildDirectPairKey($firstUser->id, $secondUser->id);

        if (isset($seenPairKeys[$pairKey])) {
            return;
        }

        $pairs[] = [$firstUser, $secondUser, $creator];
        $seenPairKeys[$pairKey] = true;
    }

    private function buildDirectPairKey(int $firstUserId, int $secondUserId): string
    {
        $orderedIds = [$firstUserId, $secondUserId];
        sort($orderedIds, SORT_NUMERIC);

        return sprintf('%d:%d', $orderedIds[0], $orderedIds[1]);
    }
}

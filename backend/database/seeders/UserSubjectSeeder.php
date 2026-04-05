<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSubjectSeeder extends Seeder
{
    /**
     * Seed subject links only for users participating in demo workflows.
     */
    public function run(): void
    {
        $subjectAssignments = [
            UserSeeder::TUTOR_EMAIL => ['Computer Science', 'Mathematics', 'Software Engineering'],
            UserSeeder::STUDENT_EMAIL => ['Computer Science'],
        ];

        $usersByEmail = User::whereIn('email', array_keys($subjectAssignments))
            ->get()
            ->keyBy('email');

        $subjectIdsByName = Subject::whereIn(
            'name',
            collect($subjectAssignments)
                ->flatten()
                ->unique()
                ->values()
                ->all()
        )->pluck('id', 'name');

        foreach ($subjectAssignments as $email => $subjectNames) {
            $user = $usersByEmail[$email] ?? null;

            if (! $user instanceof User) {
                continue;
            }

            $subjectIds = collect($subjectNames)
                ->map(fn (string $name): ?int => $subjectIdsByName[$name] ?? null)
                ->filter()
                ->values()
                ->all();

            $user->subjects()->sync($subjectIds);
        }

        $dynamicUsers = User::query()
            ->whereHas('role', fn ($query) => $query->whereIn('code', [Role::TUTOR, Role::STUDENT]))
            ->whereNotIn('email', array_keys($subjectAssignments))
            ->with('role')
            ->orderBy('id')
            ->get();

        $activeSubjectIds = Subject::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->pluck('id')
            ->all();

        foreach ($dynamicUsers as $user) {
            $subjectCount = $user->hasRole(Role::TUTOR) ? 3 : 2;

            $user->subjects()->sync(
                $this->pickSubjectIds($activeSubjectIds, $subjectCount, $user->id)
            );
        }
    }

    /**
     * @param  list<int>  $subjectIds
     * @return list<int>
     */
    private function pickSubjectIds(array $subjectIds, int $count, int $offset): array
    {
        if ($subjectIds === []) {
            return [];
        }

        $pickedSubjectIds = [];
        $limit = min($count, count($subjectIds));

        for ($index = 0; $index < $limit; $index++) {
            $pickedSubjectIds[] = $subjectIds[($offset + $index) % count($subjectIds)];
        }

        return $pickedSubjectIds;
    }
}

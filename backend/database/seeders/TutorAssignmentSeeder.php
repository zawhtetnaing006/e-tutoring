<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;

class TutorAssignmentSeeder extends Seeder
{
    /**
     * Seed the minimum allocation data needed by active features.
     */
    public function run(): void
    {
        $tutors = User::query()
            ->whereHas('role', fn ($query) => $query->where('code', Role::TUTOR))
            ->orderBy('id')
            ->get()
            ->values();

        $students = User::query()
            ->whereHas('role', fn ($query) => $query->where('code', Role::STUDENT))
            ->orderBy('id')
            ->get()
            ->values();

        $pairs = [];
        $seenPairs = [];

        $fixedTutor = $tutors->firstWhere('email', UserSeeder::TUTOR_EMAIL);
        $fixedStudent = $students->firstWhere('email', UserSeeder::STUDENT_EMAIL);

        if ($fixedTutor instanceof User && $fixedStudent instanceof User) {
            $pairKey = sprintf('%d:%d', $fixedTutor->id, $fixedStudent->id);
            $pairs[] = [$fixedTutor, $fixedStudent];
            $seenPairs[$pairKey] = true;
        }

        $otherTutors = $tutors
            ->reject(fn (User $user): bool => $user->email === UserSeeder::TUTOR_EMAIL)
            ->values();

        $otherStudents = $students
            ->reject(fn (User $user): bool => $user->email === UserSeeder::STUDENT_EMAIL)
            ->values();

        $extraPairCount = min(8, $otherTutors->count(), $otherStudents->count());

        for ($index = 0; $index < $extraPairCount; $index++) {
            $tutor = $otherTutors[$index];
            $student = $otherStudents[$index];
            $pairKey = sprintf('%d:%d', $tutor->id, $student->id);

            if (isset($seenPairs[$pairKey])) {
                continue;
            }

            $pairs[] = [$tutor, $student];
            $seenPairs[$pairKey] = true;
        }

        $baseStartDate = today()->subWeeks(2);

        foreach ($pairs as $index => [$tutor, $student]) {
            $isFixedPair = $tutor->email === UserSeeder::TUTOR_EMAIL
                && $student->email === UserSeeder::STUDENT_EMAIL;

            $startDate = $isFixedPair
                ? today()->subMonths(3)->startOfDay()
                : $baseStartDate->copy()->addDays($index * 3);
            $endDate = $isFixedPair
                ? $startDate->copy()->addMonths(5)
                : $startDate->copy()->addMonths(4);

            TutorAssignment::create([
                'tutor_user_id' => $tutor->id,
                'student_user_id' => $student->id,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'status' => TutorAssignment::resolveStatusForDate($startDate, $endDate),
            ]);
        }
    }
}

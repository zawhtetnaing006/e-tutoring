<?php

namespace Database\Seeders;

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
        $assignments = [
            [
                'tutor_email' => UserSeeder::LINKED_TUTOR_EMAIL,
                'student_email' => UserSeeder::LINKED_STUDENT_EMAIL,
                'start_date' => '2026-03-01',
                'end_date' => '2026-06-30',
            ],
            [
                'tutor_email' => 'alicia.morgan@greenwich.ac.uk',
                'student_email' => 'ava.collins@greenwich.ac.uk',
                'start_date' => '2026-03-03',
                'end_date' => '2026-06-20',
            ],
            [
                'tutor_email' => 'daniel.hsu@greenwich.ac.uk',
                'student_email' => 'benjamin.scott@greenwich.ac.uk',
                'start_date' => '2026-03-04',
                'end_date' => '2026-06-18',
            ],
            [
                'tutor_email' => 'mei.chen@greenwich.ac.uk',
                'student_email' => 'ethan.parker@greenwich.ac.uk',
                'start_date' => '2026-03-05',
                'end_date' => '2026-06-25',
            ],
            [
                'tutor_email' => 'priya.nair@greenwich.ac.uk',
                'student_email' => 'fatima.ali@greenwich.ac.uk',
                'start_date' => '2026-03-10',
                'end_date' => '2026-06-28',
            ],
            [
                'tutor_email' => 'oliver.grant@greenwich.ac.uk',
                'student_email' => 'hannah.reed@greenwich.ac.uk',
                'start_date' => '2026-03-12',
                'end_date' => '2026-06-26',
            ],
        ];

        $usersByEmail = User::whereIn(
            'email',
            collect($assignments)
                ->flatMap(fn (array $assignment): array => [
                    $assignment['tutor_email'],
                    $assignment['student_email'],
                ])
                ->unique()
                ->values()
                ->all()
        )->get()->keyBy('email');

        foreach ($assignments as $assignmentData) {
            $tutor = $usersByEmail[$assignmentData['tutor_email']] ?? null;
            $student = $usersByEmail[$assignmentData['student_email']] ?? null;

            if (! $tutor instanceof User || ! $student instanceof User) {
                continue;
            }

            TutorAssignment::create([
                'tutor_user_id' => $tutor->id,
                'student_user_id' => $student->id,
                'start_date' => $assignmentData['start_date'],
                'end_date' => $assignmentData['end_date'],
            ]);
        }
    }
}

<?php

namespace Database\Seeders;

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
            UserSeeder::LINKED_TUTOR_EMAIL => ['Computer Science', 'Mathematics', 'Software Engineering'],
            UserSeeder::LINKED_STUDENT_EMAIL => ['Mathematics'],
            'alicia.morgan@greenwich.ac.uk' => ['Academic English', 'English Literature'],
            'daniel.hsu@greenwich.ac.uk' => ['Computer Science', 'Data Science', 'Statistics'],
            'mei.chen@greenwich.ac.uk' => ['Mathematics', 'Engineering Mathematics', 'Physics'],
            'oliver.grant@greenwich.ac.uk' => ['Business Management', 'International Business', 'Project Management'],
            'priya.nair@greenwich.ac.uk' => ['Cyber Security', 'Computer Science', 'Software Engineering'],
            'samuel.brooks@greenwich.ac.uk' => ['Business Management', 'Project Management'],
            'ava.collins@greenwich.ac.uk' => ['Academic English', 'English Literature'],
            'benjamin.scott@greenwich.ac.uk' => ['Data Science', 'Statistics'],
            'chloe.turner@greenwich.ac.uk' => ['Business Management', 'Project Management'],
            'ethan.parker@greenwich.ac.uk' => ['Engineering Mathematics', 'Mathematics', 'Physics'],
            'fatima.ali@greenwich.ac.uk' => ['Cyber Security', 'Computer Science'],
            'hannah.reed@greenwich.ac.uk' => ['Business Management', 'Economics'],
            'isaac.foster@greenwich.ac.uk' => ['Graphic Design', 'Media Studies'],
            'jasmine.lee@greenwich.ac.uk' => ['Law', 'Psychology'],
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
    }
}

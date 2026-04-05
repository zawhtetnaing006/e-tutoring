<?php

namespace Database\Seeders;

use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\MeetingSchedule;
use App\Models\TutorAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;

class MeetingSeeder extends Seeder
{
    /**
     * Seed a deterministic meeting timeline for the fixed tutor-student demo pair.
     */
    public function run(): void
    {
        $tutor = User::query()->where('email', UserSeeder::TUTOR_EMAIL)->first();
        $student = User::query()->where('email', UserSeeder::STUDENT_EMAIL)->first();

        if (! $tutor instanceof User || ! $student instanceof User) {
            return;
        }

        $assignment = TutorAssignment::query()
            ->where('tutor_user_id', $tutor->id)
            ->where('student_user_id', $student->id)
            ->orderByDesc('id')
            ->first();

        if (! $assignment instanceof TutorAssignment) {
            return;
        }

        $meeting = Meeting::create([
            'title' => 'Weekly Computer Science Coaching',
            'description' => 'Ongoing weekly tutoring plan covering programming fundamentals, data structures, debugging, and mock practical prep.',
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.google.com/greenwich-cs-coaching',
            'location' => null,
            'tutor_assignment_id' => $assignment->id,
        ]);

        $startDate = today()->copy()->startOfWeek()->subWeeks(10)->addDays(2);

        foreach ($this->scheduleBlueprints() as $index => $blueprint) {
            $scheduleDate = $startDate->copy()->addWeeks($index);
            $hasRetrospectiveNote = $scheduleDate->lessThan(today());

            $schedule = MeetingSchedule::create([
                'meeting_id' => $meeting->id,
                'date' => $scheduleDate->toDateString(),
                'start_time' => $blueprint['start_time'],
                'end_time' => $blueprint['end_time'],
                'note' => $hasRetrospectiveNote ? $blueprint['note'] : null,
                'cancel_at' => $blueprint['cancelled']
                    ? $scheduleDate->copy()->subDays(1)->setTime(18, 0)
                    : null,
            ]);

            if ($schedule->cancel_at !== null || $scheduleDate->greaterThanOrEqualTo(today())) {
                continue;
            }

            MeetingAttendee::create([
                'meeting_id' => $meeting->id,
                'meeting_schedule_id' => $schedule->id,
                'user_id' => $student->id,
                'status' => $blueprint['attendance'],
            ]);
        }
    }

    /**
     * @return list<array{
     *     start_time: string,
     *     end_time: string,
     *     note: string,
     *     cancelled: bool,
     *     attendance: string
     * }>
     */
    private function scheduleBlueprints(): array
    {
        return [
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Diagnostic review, coding baseline check, and study plan kickoff.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Programming fundamentals, variables, and control flow practice.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Functions, decomposition, and basic debugging exercises.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Arrays, strings, and input-processing drills.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Algorithm tracing and short coding quiz review.',
                'cancelled' => false,
                'attendance' => 'ABSENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Cancelled recursion workshop and self-study task follow-up.',
                'cancelled' => true,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Recursion and problem decomposition with worked examples.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Linked lists and stack concepts with correction review.',
                'cancelled' => false,
                'attendance' => 'ON_LEAVE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Queues, complexity basics, and timed implementation drills.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Searching and sorting strategies with dry-run practice.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Object-oriented design recap and class modelling review.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Upcoming session on mixed-topic problem solving and debugging.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Mock practical review and revision priorities.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Final coding revision sprint before the assessment window.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
            [
                'start_time' => '16:00',
                'end_time' => '17:30',
                'note' => 'Buffer session reserved for any final weak-topic coding review.',
                'cancelled' => false,
                'attendance' => 'PRESENCE',
            ],
        ];
    }
}

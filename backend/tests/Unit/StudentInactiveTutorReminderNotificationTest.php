<?php

namespace Tests\Unit;

use App\Models\User;
use App\Notifications\StudentInactiveTutorReminderNotification;
use Carbon\Carbon;
use Tests\TestCase;

class StudentInactiveTutorReminderNotificationTest extends TestCase
{
    public function test_active_assignment_mail_content_is_tutor_specific(): void
    {
        $student = new User(['name' => 'Student User']);
        $tutor = new User(['name' => 'Tutor User']);

        $message = (new StudentInactiveTutorReminderNotification(
            $student,
            28,
            Carbon::parse('2026-02-24 10:15:00'),
            false
        ))->toMail($tutor);

        $this->assertSame('Student User has been inactive on '.config('app.name'), $message->subject);
        $this->assertSame('mail.student-inactive-tutor-reminder', $message->markdown);
        $this->assertSame('Tutor User', $message->viewData['recipientName']);
        $this->assertSame('Student User', $message->viewData['studentName']);
        $this->assertSame('your assigned student', $message->viewData['studentRelationLabel']);
    }

    public function test_latest_assignment_fallback_mail_content_mentions_previous_assignment(): void
    {
        $student = new User(['name' => 'Student User']);
        $tutor = new User(['name' => 'Tutor User']);

        $message = (new StudentInactiveTutorReminderNotification(
            $student,
            35,
            Carbon::parse('2026-02-17 09:00:00'),
            true
        ))->toMail($tutor);

        $this->assertSame('Student User has been inactive on '.config('app.name'), $message->subject);
        $this->assertSame('mail.student-inactive-tutor-reminder', $message->markdown);
        $this->assertSame('a student previously assigned to you', $message->viewData['studentRelationLabel']);
        $this->assertSame(35, $message->viewData['daysInactive']);
    }
}

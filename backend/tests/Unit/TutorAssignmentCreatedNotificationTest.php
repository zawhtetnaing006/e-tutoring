<?php

namespace Tests\Unit;

use App\Models\TutorAssignment;
use App\Models\User;
use App\Notifications\TutorAssignmentCreatedNotification;
use Tests\TestCase;

class TutorAssignmentCreatedNotificationTest extends TestCase
{
    public function test_tutor_mail_content_is_tutor_specific(): void
    {
        $tutor = new User(['id' => 10, 'name' => 'Tutor User']);
        $student = new User(['id' => 20, 'name' => 'Student User']);
        $assignment = $this->makeAssignment($tutor, $student);

        $message = (new TutorAssignmentCreatedNotification($assignment))->toMail($tutor);

        $this->assertSame('New allocation created on '.config('app.name'), $message->subject);
        $this->assertSame('mail.tutor-assignment-created', $message->markdown);
        $this->assertSame('A new allocation has been created for you with student Student User.', $message->viewData['introLine']);
        $this->assertSame('Student', $message->viewData['counterpartyLabel']);
        $this->assertSame('Student User', $message->viewData['counterpartyName']);
    }

    public function test_student_mail_content_is_student_specific(): void
    {
        $tutor = new User(['id' => 10, 'name' => 'Tutor User']);
        $student = new User(['id' => 20, 'name' => 'Student User']);
        $assignment = $this->makeAssignment($tutor, $student);

        $message = (new TutorAssignmentCreatedNotification($assignment))->toMail($student);

        $this->assertSame('New allocation created on '.config('app.name'), $message->subject);
        $this->assertSame('mail.tutor-assignment-created', $message->markdown);
        $this->assertSame('A new allocation has been created for you with tutor Tutor User.', $message->viewData['introLine']);
        $this->assertSame('Tutor', $message->viewData['counterpartyLabel']);
        $this->assertSame('Tutor User', $message->viewData['counterpartyName']);
    }

    private function makeAssignment(User $tutor, User $student): TutorAssignment
    {
        $tutor->setAttribute('id', 10);
        $student->setAttribute('id', 20);

        $assignment = new TutorAssignment([
            'tutor_user_id' => 10,
            'student_user_id' => 20,
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-30',
            'status' => TutorAssignment::STATUS_ACTIVE,
        ]);

        $assignment->setRelation('tutor', $tutor);
        $assignment->setRelation('student', $student);

        return $assignment;
    }
}

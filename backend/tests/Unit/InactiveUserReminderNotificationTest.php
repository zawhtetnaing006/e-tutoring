<?php

namespace Tests\Unit;

use App\Models\Role;
use App\Models\User;
use App\Notifications\InactiveUserReminderNotification;
use Tests\TestCase;

class InactiveUserReminderNotificationTest extends TestCase
{
    public function test_student_mail_content_is_role_specific(): void
    {
        $user = $this->makeUserWithRole(Role::STUDENT, 'Student');

        $message = (new InactiveUserReminderNotification(28, now()->subDays(28)))->toMail($user);

        $this->assertSame('Your student account has been inactive on '.config('app.name'), $message->subject);
        $this->assertSame('mail.inactive-user-reminder', $message->markdown);
        $this->assertSame('Our records show that your student account has been inactive for 28 days.', $message->viewData['introLine']);
        $this->assertSame('Please sign in again when you are ready to continue your learning activities.', $message->viewData['closingLine']);
    }

    public function test_tutor_mail_content_is_role_specific(): void
    {
        $user = $this->makeUserWithRole(Role::TUTOR, 'Tutor');

        $message = (new InactiveUserReminderNotification(28, now()->subDays(28)))->toMail($user);

        $this->assertSame('Your tutor account has been inactive on '.config('app.name'), $message->subject);
        $this->assertSame('mail.inactive-user-reminder', $message->markdown);
        $this->assertSame('Our records show that your tutor account has been inactive for 28 days.', $message->viewData['introLine']);
        $this->assertSame('Please sign in again when you are ready to continue your tutoring activities.', $message->viewData['closingLine']);
    }

    public function test_staff_mail_content_is_role_specific(): void
    {
        $user = $this->makeUserWithRole(Role::STAFF, 'Staff');

        $message = (new InactiveUserReminderNotification(28, now()->subDays(28)))->toMail($user);

        $this->assertSame('Your staff account has been inactive on '.config('app.name'), $message->subject);
        $this->assertSame('mail.inactive-user-reminder', $message->markdown);
        $this->assertSame('Our records show that your staff account has been inactive for 28 days.', $message->viewData['introLine']);
        $this->assertSame('Please sign in again when you are ready to continue managing platform operations.', $message->viewData['closingLine']);
    }

    public function test_admin_mail_content_is_role_specific(): void
    {
        $user = $this->makeUserWithRole(Role::ADMIN, 'Admin');

        $message = (new InactiveUserReminderNotification(28, now()->subDays(28)))->toMail($user);

        $this->assertSame('Your admin account has been inactive on '.config('app.name'), $message->subject);
        $this->assertSame('mail.inactive-user-reminder', $message->markdown);
        $this->assertSame('Our records show that your admin account has been inactive for 28 days.', $message->viewData['introLine']);
        $this->assertSame('Please sign in again when you are ready to continue platform administration.', $message->viewData['closingLine']);
    }

    private function makeUserWithRole(string $roleCode, string $roleName): User
    {
        $user = new User([
            'name' => 'Role User',
            'email' => 'role-user@example.test',
        ]);

        $user->setRelation('role', new Role([
            'code' => $roleCode,
            'name' => $roleName,
        ]));

        return $user;
    }
}

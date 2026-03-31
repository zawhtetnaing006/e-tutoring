<?php

namespace Tests\Unit;

use App\Models\Role;
use App\Models\User;
use App\Notifications\UserWelcomeNotification;
use Tests\TestCase;

class UserWelcomeNotificationTest extends TestCase
{
    public function test_staff_mail_content_is_role_specific(): void
    {
        $user = $this->makeUserWithRole(Role::STAFF, 'Staff');

        $message = (new UserWelcomeNotification())->toMail($user);

        $this->assertSame('Welcome to '.config('app.name'), $message->subject);
        $this->assertSame('mail.user-welcome', $message->markdown);
        $this->assertSame('Your staff account has been created successfully.', $message->viewData['introLine']);
        $this->assertSame('Sign in to start managing platform operations.', $message->viewData['closingLine']);
    }

    public function test_admin_mail_content_is_role_specific(): void
    {
        $user = $this->makeUserWithRole(Role::ADMIN, 'Admin');

        $message = (new UserWelcomeNotification())->toMail($user);

        $this->assertSame('Welcome to '.config('app.name'), $message->subject);
        $this->assertSame('mail.user-welcome', $message->markdown);
        $this->assertSame('Your authorized staff account has been created successfully.', $message->viewData['introLine']);
        $this->assertSame('Sign in to start managing platform administration tasks.', $message->viewData['closingLine']);
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

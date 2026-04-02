<?php

namespace Tests\Unit;

use App\Models\User;
use App\Notifications\UserGeneratedPasswordNotification;
use Tests\TestCase;

class UserGeneratedPasswordNotificationTest extends TestCase
{
    public function test_mail_content_uses_welcome_style_copy(): void
    {
        $user = new User([
            'name' => 'New User',
            'email' => 'new-user@example.test',
        ]);

        $message = (new UserGeneratedPasswordNotification('TempPass123'))->toMail($user);

        $this->assertSame('Weclome to E-tutoring', $message->subject);
        $this->assertSame('mail.user-generated-password', $message->markdown);
        $this->assertSame('Your account has been created successfully.', $message->viewData['introLine']);
        $this->assertSame('We have generated a temporary password for your first sign-in.', $message->viewData['supportingLine']);
        $this->assertSame('TempPass123', $message->viewData['password']);
        $this->assertSame((string) config('app.url'), $message->viewData['appUrl']);
        $this->assertSame('Please sign in and change your password as soon as possible.', $message->viewData['closingLine']);
    }
}

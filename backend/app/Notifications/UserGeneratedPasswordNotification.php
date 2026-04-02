<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserGeneratedPasswordNotification extends Notification
{
    use Queueable;

    private const SUBJECT = 'Weclome to E-tutoring';

    public function __construct(
        private readonly string $password
    ) {
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = self::SUBJECT;

        return (new MailMessage)
            ->subject($subject)
            ->markdown('mail.user-generated-password', [
                'subjectLine' => $subject,
                'recipientName' => (string) ($notifiable->name ?? 'there'),
                'introLine' => 'Your account has been created successfully.',
                'supportingLine' => 'We have generated a temporary password for your first sign-in.',
                'password' => $this->password,
                'appUrl' => (string) config('app.url'),
                'closingLine' => 'Please sign in and change your password as soon as possible.',
            ]);
    }
}

<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserGeneratedPasswordNotification extends Notification
{
    use Queueable;

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
        $subject = 'Your new account password';

        return (new MailMessage)
            ->subject($subject)
            ->markdown('mail.user-generated-password', [
                'subjectLine' => $subject,
                'recipientName' => (string) ($notifiable->name ?? 'there'),
                'password' => $this->password,
            ]);
    }
}

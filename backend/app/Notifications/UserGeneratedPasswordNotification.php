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
        return (new MailMessage)
            ->subject('Your new account password')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('An account has been created for you.')
            ->line('Your generated temporary password is:')
            ->line($this->password)
            ->line('Please sign in and change your password as soon as possible.');
    }
}

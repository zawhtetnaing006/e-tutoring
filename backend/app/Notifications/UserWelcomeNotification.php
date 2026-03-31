<?php

namespace App\Notifications;

use App\Models\Role;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserWelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $roleCode = $this->resolveRoleCode($notifiable);
        $subject = sprintf('Welcome to %s', config('app.name'));

        return (new MailMessage)
            ->subject($subject)
            ->markdown('mail.user-welcome', [
                'subjectLine' => $subject,
                'recipientName' => (string) ($notifiable->name ?? 'there'),
                'introLine' => $this->introForRole($roleCode),
                'closingLine' => $this->closingForRole($roleCode),
                'appUrl' => (string) config('app.url'),
            ]);
    }

    private function resolveRoleCode(object $notifiable): ?string
    {
        if (! $notifiable instanceof User) {
            return null;
        }

        $notifiable->loadMissing('role:id,code');

        $roleCode = strtoupper((string) $notifiable->role?->code);

        return $roleCode !== '' ? $roleCode : null;
    }

    private function introForRole(?string $roleCode): string
    {
        return match ($roleCode) {
            Role::STUDENT => 'Your student account has been created successfully.',
            Role::TUTOR => 'Your tutor account has been created successfully.',
            Role::STAFF => 'Your staff account has been created successfully.',
            Role::ADMIN => 'Your authorized staff account has been created successfully.',
            default => 'Your account has been created successfully.',
        };
    }

    private function closingForRole(?string $roleCode): string
    {
        return match ($roleCode) {
            Role::STUDENT => 'Sign in to start accessing your learning activities.',
            Role::TUTOR => 'Sign in to start managing your tutoring activities.',
            Role::STAFF => 'Sign in to start managing platform operations.',
            Role::ADMIN => 'Sign in to start managing platform administration tasks.',
            default => 'Sign in to access the platform.',
        };
    }
}

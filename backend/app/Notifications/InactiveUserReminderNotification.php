<?php

namespace App\Notifications;

use App\Models\Role;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InactiveUserReminderNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $daysInactive,
        private readonly CarbonInterface $latestActivityAt,
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
        $roleCode = $this->resolveRoleCode($notifiable);
        $subject = $this->subjectForRole($roleCode);

        return (new MailMessage)
            ->subject($subject)
            ->markdown('mail.inactive-user-reminder', [
                'subjectLine' => $subject,
                'recipientName' => (string) ($notifiable->name ?? 'there'),
                'introLine' => sprintf(
                    $this->introForRole($roleCode),
                    $this->daysInactive
                ),
                'latestActivityAt' => $this->latestActivityAt->toDayDateTimeString(),
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

    private function subjectForRole(?string $roleCode): string
    {
        return match ($roleCode) {
            Role::STUDENT => sprintf('Your student account has been inactive on %s', config('app.name')),
            Role::TUTOR => sprintf('Your tutor account has been inactive on %s', config('app.name')),
            Role::STAFF => sprintf('Your staff account has been inactive on %s', config('app.name')),
            Role::ADMIN => sprintf('Your admin account has been inactive on %s', config('app.name')),
            default => sprintf('Your account has been inactive on %s', config('app.name')),
        };
    }

    private function introForRole(?string $roleCode): string
    {
        return match ($roleCode) {
            Role::STUDENT => 'Our records show that your student account has been inactive for %d days.',
            Role::TUTOR => 'Our records show that your tutor account has been inactive for %d days.',
            Role::STAFF => 'Our records show that your staff account has been inactive for %d days.',
            Role::ADMIN => 'Our records show that your admin account has been inactive for %d days.',
            default => 'Our records show that your account has been inactive for %d days.',
        };
    }

    private function closingForRole(?string $roleCode): string
    {
        return match ($roleCode) {
            Role::STUDENT => 'Please sign in again when you are ready to continue your learning activities.',
            Role::TUTOR => 'Please sign in again when you are ready to continue your tutoring activities.',
            Role::STAFF => 'Please sign in again when you are ready to continue managing platform operations.',
            Role::ADMIN => 'Please sign in again when you are ready to continue platform administration.',
            default => 'Please sign in again when you are ready to continue using the platform.',
        };
    }
}

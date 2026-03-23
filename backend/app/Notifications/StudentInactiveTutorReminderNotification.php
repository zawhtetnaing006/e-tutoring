<?php

namespace App\Notifications;

use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StudentInactiveTutorReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly User $student,
        private readonly int $daysInactive,
        private readonly CarbonInterface $latestActivityAt,
        private readonly bool $usingLatestAssignmentFallback = false,
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
        $studentName = (string) ($this->student->name ?? 'A student');
        $subject = sprintf('%s has been inactive on %s', $studentName, config('app.name'));

        return (new MailMessage)
            ->subject($subject)
            ->markdown('mail.student-inactive-tutor-reminder', [
                'subjectLine' => $subject,
                'recipientName' => (string) ($notifiable->name ?? 'there'),
                'studentName' => $studentName,
                'daysInactive' => $this->daysInactive,
                'latestActivityAt' => $this->latestActivityAt->toDayDateTimeString(),
                'studentRelationLabel' => $this->usingLatestAssignmentFallback
                    ? 'a student previously assigned to you'
                    : 'your assigned student',
                'appUrl' => (string) config('app.url'),
            ]);
    }
}

<?php

namespace App\Notifications;

use App\Models\TutorAssignment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TutorAssignmentCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly TutorAssignment $assignment
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
        $assignment = $this->assignment->loadMissing([
            'tutor:id,name',
            'student:id,name',
        ]);

        $isTutorRecipient = $notifiable instanceof User
            && (int) $notifiable->id === (int) $assignment->tutor_user_id;

        $recipientName = (string) ($notifiable->name ?? 'there');
        $counterpartyName = $isTutorRecipient
            ? (string) ($assignment->student?->name ?? 'your student')
            : (string) ($assignment->tutor?->name ?? 'your tutor');
        $subject = sprintf('New allocation created on %s', config('app.name'));

        return (new MailMessage)
            ->subject($subject)
            ->markdown('mail.tutor-assignment-created', [
                'subjectLine' => $subject,
                'recipientName' => $recipientName,
                'introLine' => $isTutorRecipient
                    ? sprintf('A new allocation has been created for you with student %s.', $counterpartyName)
                    : sprintf('A new allocation has been created for you with tutor %s.', $counterpartyName),
                'counterpartyLabel' => $isTutorRecipient ? 'Student' : 'Tutor',
                'counterpartyName' => $counterpartyName,
                'fromDate' => (string) $assignment->start_date,
                'toDate' => (string) $assignment->end_date,
                'appUrl' => (string) config('app.url'),
            ]);
    }
}

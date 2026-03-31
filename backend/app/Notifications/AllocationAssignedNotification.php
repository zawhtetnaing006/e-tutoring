<?php

namespace App\Notifications;

use App\Models\TutorAssignment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class AllocationAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly TutorAssignment $assignment,
    ) {
        $this->assignment->loadMissing([
            'tutor:id,name',
            'student:id,name',
        ]);
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New Allocation',
            'body' => sprintf(
                'A new allocation has been created for you with %s.',
                $this->counterpartyName($notifiable),
            ),
            'action' => [
                'route' => '/allocations',
                'query' => [
                    'allocation' => (int) $this->assignment->id,
                ],
            ],
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function broadcastType(): string
    {
        return 'allocation_assigned';
    }

    private function counterpartyName(object $notifiable): string
    {
        $isTutorRecipient = $notifiable instanceof User
            && (int) $notifiable->id === (int) $this->assignment->tutor_user_id;

        return $isTutorRecipient
            ? (string) ($this->assignment->student?->name ?? 'your student')
            : (string) ($this->assignment->tutor?->name ?? 'your tutor');
    }
}

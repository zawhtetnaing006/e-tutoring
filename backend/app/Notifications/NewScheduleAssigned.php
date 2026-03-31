<?php

namespace App\Notifications;

use App\Models\Meeting;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewScheduleAssigned extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Meeting $meeting,
    ) {
        $this->meeting->loadMissing('schedules:id,meeting_id');
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
            'title' => 'New Schedule Assigned',
            'body' => sprintf(
                'A new schedule has been assigned for %s.',
                (string) $this->meeting->title
            ),
            'action' => [
                'route' => '/meeting-manager',
                'query' => array_filter([
                    'meeting' => (int) $this->meeting->id,
                    'schedule' => $this->meeting->schedules->first()?->id,
                ], static fn (mixed $value): bool => $value !== null),
            ],
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function broadcastType(): string
    {
        return 'new_schedule_assigned';
    }
}

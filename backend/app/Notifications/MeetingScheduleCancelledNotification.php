<?php

namespace App\Notifications;

use App\Models\MeetingSchedule;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class MeetingScheduleCancelledNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly MeetingSchedule $meetingSchedule,
    ) {
        $this->meetingSchedule->loadMissing('meeting:id,title');
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
            'title' => 'Meeting Schedule Cancelled',
            'body' => sprintf(
                'The schedule for %s has been cancelled.',
                (string) ($this->meetingSchedule->meeting?->title ?? 'your meeting')
            ),
            'action' => [
                'route' => '/meeting-manager',
                'query' => [
                    'meeting' => (int) $this->meetingSchedule->meeting_id,
                    'schedule' => (int) $this->meetingSchedule->id,
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
        return 'meeting_schedule_cancelled';
    }
}

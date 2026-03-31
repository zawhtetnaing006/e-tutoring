<?php

namespace App\Notifications;

use App\Models\MeetingSchedule;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class MeetingScheduleUpdatedNotification extends Notification
{
    use Queueable;

    /**
     * @param  list<string>  $changedFields
     */
    public function __construct(
        private readonly MeetingSchedule $meetingSchedule,
        private readonly array $changedFields = [],
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
            'title' => 'Meeting Schedule Updated',
            'body' => $this->buildBody(),
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
        return 'meeting_schedule_updated';
    }

    private function buildBody(): string
    {
        $title = (string) ($this->meetingSchedule->meeting?->title ?? 'your meeting');
        $fieldLabels = array_values(array_unique(array_map(
            static fn (string $field): string => match ($field) {
                'start_time' => 'start time',
                'end_time' => 'end time',
                default => strtolower(str_replace('_', ' ', $field)),
            },
            $this->changedFields,
        )));

        if ($fieldLabels === []) {
            return sprintf('The schedule for %s was updated.', $title);
        }

        return sprintf(
            'The schedule for %s was updated: %s.',
            $title,
            implode(', ', $fieldLabels),
        );
    }
}

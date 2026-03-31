<?php

namespace App\Notifications;

use App\Models\TutorAssignment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class AllocationUpdatedNotification extends Notification
{
    use Queueable;

    /**
     * @param  list<string>  $changedFields
     */
    public function __construct(
        private readonly TutorAssignment $assignment,
        private readonly array $changedFields = [],
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
            'title' => 'Allocation Updated',
            'body' => $this->buildBody($notifiable),
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
        return 'allocation_updated';
    }

    private function buildBody(object $notifiable): string
    {
        $body = sprintf(
            'Your allocation with %s was updated',
            $this->counterpartyName($notifiable),
        );

        $fieldLabels = $this->fieldLabels();

        if ($fieldLabels === []) {
            return $body . '.';
        }

        return sprintf('%s: %s.', $body, implode(', ', $fieldLabels));
    }

    private function counterpartyName(object $notifiable): string
    {
        $isTutorRecipient = $notifiable instanceof User
            && (int) $notifiable->id === (int) $this->assignment->tutor_user_id;

        return $isTutorRecipient
            ? (string) ($this->assignment->student?->name ?? 'your student')
            : (string) ($this->assignment->tutor?->name ?? 'your tutor');
    }

    /**
     * @return list<string>
     */
    private function fieldLabels(): array
    {
        return array_values(array_unique(array_map(
            static fn (string $field): string => match ($field) {
                'tutor_user_id' => 'tutor',
                'student_user_id' => 'student',
                'from_date' => 'start date',
                'to_date' => 'end date',
                default => strtolower(str_replace('_', ' ', $field)),
            },
            $this->changedFields,
        )));
    }
}

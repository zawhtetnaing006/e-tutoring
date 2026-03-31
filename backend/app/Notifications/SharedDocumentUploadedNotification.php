<?php

namespace App\Notifications;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class SharedDocumentUploadedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Document $document,
    ) {
        $this->document->loadMissing('uploader:id,name');
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
            'title' => 'New Shared Document',
            'body' => sprintf(
                '%s uploaded "%s" for review.',
                (string) ($this->document->uploader?->name ?? 'Someone'),
                (string) $this->document->file_name,
            ),
            'action' => [
                'route' => '/communication-hub',
                'query' => [
                    'conversation' => (int) $this->document->conversation_id,
                    'document' => (int) $this->document->id,
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
        return 'shared_document_uploaded';
    }
}

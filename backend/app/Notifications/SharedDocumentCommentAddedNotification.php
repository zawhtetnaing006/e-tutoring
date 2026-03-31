<?php

namespace App\Notifications;

use App\Models\DocumentComment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class SharedDocumentCommentAddedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly DocumentComment $comment,
    ) {
        $this->comment->loadMissing([
            'commenter:id,name',
            'document:id,conversation_id,file_name',
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
            'title' => 'New Document Comment',
            'body' => sprintf(
                '%s commented on "%s".',
                (string) ($this->comment->commenter?->name ?? 'Someone'),
                (string) ($this->comment->document?->file_name ?? 'your document'),
            ),
            'action' => [
                'route' => '/communication-hub',
                'query' => [
                    'conversation' => (int) ($this->comment->document?->conversation_id ?? 0),
                    'document' => (int) $this->comment->document_id,
                    'comment' => (int) $this->comment->id,
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
        return 'shared_document_comment_added';
    }
}

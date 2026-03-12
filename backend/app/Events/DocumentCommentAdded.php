<?php

namespace App\Events;

use App\Models\DocumentComment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentCommentAdded implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public DocumentComment $comment,
    ) {
        $this->comment->loadMissing([
            'commenter:id,name',
            'document:id,conversation_id',
        ]);
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('conversation.' . $this->comment->document->conversation_id);
    }

    public function broadcastAs(): string
    {
        return 'document.comment.added';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->comment->id,
            'document_id' => $this->comment->document_id,
            'conversation_id' => $this->comment->document->conversation_id,
            'commenter_user_id' => $this->comment->commenter_user_id,
            'commenter_name' => (string) ($this->comment->commenter?->name ?? ''),
            'comment' => $this->comment->comment,
            'created_at' => $this->comment->created_at?->toISOString(),
            'updated_at' => $this->comment->updated_at?->toISOString(),
        ];
    }
}

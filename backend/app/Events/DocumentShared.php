<?php

namespace App\Events;

use App\Models\Document;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class DocumentShared implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public Document $document,
    ) {
        $this->document
            ->loadMissing('uploader:id,name')
            ->loadCount('comments');
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('conversation.' . $this->document->conversation_id);
    }

    public function broadcastAs(): string
    {
        return 'document.shared';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $filePath = $this->document->file_path;
        /** @var FilesystemAdapter $publicDisk */
        $publicDisk = Storage::disk('public');

        return [
            'id' => $this->document->id,
            'conversation_id' => $this->document->conversation_id,
            'uploaded_by_user_id' => $this->document->uploaded_by_user_id,
            'uploader_name' => (string) ($this->document->uploader?->name ?? ''),
            'file_name' => $this->document->file_name,
            'file_path' => $filePath,
            'file_url' => $filePath ? $publicDisk->url($filePath) : null,
            'file_size_bytes' => $this->document->file_size_bytes,
            'mime_type' => $this->document->mime_type,
            'comments_count' => $this->document->comments_count,
            'created_at' => $this->document->created_at?->toISOString(),
            'updated_at' => $this->document->updated_at?->toISOString(),
        ];
    }
}

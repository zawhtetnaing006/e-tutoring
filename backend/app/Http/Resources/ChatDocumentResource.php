<?php

namespace App\Http\Resources;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ChatDocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $filePath = $this->resource->file_path;
        /** @var FilesystemAdapter $publicDisk */
        $publicDisk = Storage::disk('public');

        return [
            'id' => $this->resource->id,
            'conversation_id' => $this->resource->conversation_id,
            'uploaded_by_user_id' => $this->resource->uploaded_by_user_id,
            'uploader_name' => (string) ($this->resource->uploader?->name ?? ''),
            'file_name' => $this->resource->file_name,
            'file_path' => $filePath,
            'file_url' => $filePath ? $publicDisk->url($filePath) : null,
            'file_size_bytes' => $this->resource->file_size_bytes,
            'mime_type' => $this->resource->mime_type,
            'comments_count' => $this->whenCounted('comments'),
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

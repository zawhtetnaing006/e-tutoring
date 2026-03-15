<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatDocumentCommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $conversationId = $this->resource->document?->conversation_id;

        return [
            'id' => $this->resource->id,
            'document_id' => $this->resource->document_id,
            'conversation_id' => $conversationId,
            'commenter_user_id' => $this->resource->commenter_user_id,
            'commenter_name' => (string) ($this->resource->commenter?->name ?? ''),
            'comment' => $this->resource->comment,
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

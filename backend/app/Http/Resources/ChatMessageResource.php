<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'conversation_id' => $this->resource->conversation_id,
            'sender_id' => $this->resource->sender_user_id,
            'sender_name' => (string) ($this->resource->sender?->name ?? ''),
            'content' => $this->resource->content,
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

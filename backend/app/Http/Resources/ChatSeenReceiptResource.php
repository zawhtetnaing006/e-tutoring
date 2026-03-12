<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatSeenReceiptResource extends JsonResource
{
    /**
     * @return array<string, int|string|null>
     */
    public function toArray(Request $request): array
    {
        return [
            'conversation_id' => $this->resource->conversation_id,
            'user_id' => $this->resource->user_id,
            'last_seen_message_id' => $this->resource->last_seen_message_id,
            'seen_at' => $this->resource->last_seen_at?->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $lastMessage = $this->resource instanceof Conversation
            ? $this->resource->latestMessage
            : null;
        $members = $this->resource instanceof Conversation
            ? $this->resource->members
                ->pluck('user')
                ->filter()
                ->values()
            : collect();
        $memberResources = ChatUserResource::collection($members)->resolve($request);

        return [
            'id' => $this->resource->id,
            'members' => $memberResources,
            'last_message' => $lastMessage instanceof Message
                ? new ChatMessageResource($lastMessage)
                : null,
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

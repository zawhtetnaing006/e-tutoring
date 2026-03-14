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
        $currentUserId = $request->user()?->id;
        $members = $this->resource instanceof Conversation
            ? $this->resource->members
                ->pluck('user')
                ->filter()
                ->values()
            : collect();
        $currentMember = $this->resource instanceof Conversation && $currentUserId !== null
            ? $this->resource->members->first(fn ($member): bool => (int) $member->user_id === (int) $currentUserId)
            : null;
        $otherMember = $this->resource instanceof Conversation && $currentUserId !== null
            ? $this->resource->members->first(fn ($member): bool => (int) $member->user_id !== (int) $currentUserId)
            : null;
        $memberResources = ChatUserResource::collection($members)->resolve($request);

        return [
            'id' => $this->resource->id,
            'members' => $memberResources,
            'last_message' => $lastMessage instanceof Message
                ? new ChatMessageResource($lastMessage)
                : null,
            'current_user_last_seen_message_id' => $currentMember?->last_seen_message_id,
            'other_user_last_seen_message_id' => $otherMember?->last_seen_message_id,
            'other_user_seen_at' => $otherMember?->last_seen_at?->toISOString(),
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

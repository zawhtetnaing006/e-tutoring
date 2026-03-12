<?php

use App\Models\ConversationMember;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('conversation.{conversationId}', function (User $user, int $conversationId): bool {
    return ConversationMember::query()
        ->where('conversation_id', $conversationId)
        ->where('user_id', $user->id)
        ->exists();
});

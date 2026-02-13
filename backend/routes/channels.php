<?php

use App\Models\ConversationMember;
use Illuminate\Support\Facades\Broadcast;

// Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
//     return (int) $user->id === (int) $id;
// });

Broadcast::channel('conversation.{id}', function ($user, $id) {
    if (! $user) {
        return false;
    }

    return ConversationMember::query()
        ->where('conversation_id', (int) $id)
        ->where('user_id', (int) $user->id)
        ->whereNull('left_at')
        ->exists();
});

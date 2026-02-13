<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\ConversationMember;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController
{
    public function createDirectConversation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $currentUserId = (int) $request->user()->id;
        $otherUserId = (int) $data['user_id'];

        if ($otherUserId === $currentUserId) {
            return response()->json([
                'message' => 'You cannot create a direct conversation with yourself.',
            ], 422);
        }

        $ids = [$currentUserId, $otherUserId];
        sort($ids, SORT_NUMERIC);
        $pairKey = "{$ids[0]}:{$ids[1]}";

        $conversation = DB::transaction(function () use ($currentUserId, $otherUserId, $pairKey): Conversation {
            $conversation = Conversation::query()->firstOrCreate(
                [
                    'type' => 'direct',
                    'direct_pair_key' => $pairKey,
                ],
                [
                    'name' => null,
                    'created_by' => $currentUserId,
                ],
            );

            $now = now();

            ConversationMember::query()->upsert(
                [
                    [
                        'conversation_id' => $conversation->id,
                        'user_id' => $currentUserId,
                        'joined_at' => $now,
                        'left_at' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                    [
                        'conversation_id' => $conversation->id,
                        'user_id' => $otherUserId,
                        'joined_at' => $now,
                        'left_at' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                ],
                ['conversation_id', 'user_id'],
                ['joined_at', 'left_at', 'updated_at'],
            );

            return $conversation;
        });

        return response()->json([
            'data' => [
                'id' => $conversation->id,
                'type' => $conversation->type,
                'name' => $conversation->name,
                'created_by' => $conversation->created_by,
                'direct_pair_key' => $conversation->direct_pair_key,
                'created_at' => $conversation->created_at?->toISOString(),
                'updated_at' => $conversation->updated_at?->toISOString(),
            ],
        ]);
    }

    public function listMessages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->ensureConversationMember($request, $conversation);

        $perPage = max(1, min(100, (int) $request->integer('per_page', 20)));

        $messages = Message::query()
            ->where('conversation_id', $conversation->id)
            ->latest('id')
            ->paginate($perPage);

        return response()->json($messages);
    }

    public function sendMessage(Request $request, Conversation $conversation): JsonResponse
    {
        $this->ensureConversationMember($request, $conversation);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $message = Message::query()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => (int) $request->user()->id,
            'body' => $data['body'],
        ]);

        $conversation->touch();

        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'data' => [
                'id' => $message->id,
                'conversation_id' => $message->conversation_id,
                'sender_id' => $message->sender_id,
                'body' => $message->body,
                'edited_at' => $message->edited_at?->toISOString(),
                'created_at' => $message->created_at?->toISOString(),
                'updated_at' => $message->updated_at?->toISOString(),
            ],
        ], 201);
    }

    private function ensureConversationMember(Request $request, Conversation $conversation): void
    {
        $isMember = ConversationMember::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', (int) $request->user()->id)
            ->whereNull('left_at')
            ->exists();

        abort_unless($isMember, 403, 'You are not a member of this conversation.');
    }
}

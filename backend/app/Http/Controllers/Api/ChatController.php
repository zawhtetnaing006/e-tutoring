<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\ChatMessageResource;
use App\Http\Resources\ChatConversationResource;
use App\Models\TutorAssignment;
use App\Services\ChatService;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

#[Group('Chat', description: 'Chat conversations and messages.', weight: 7)]
class ChatController
{
    public function __construct(
        private readonly ChatService $chatService,
    ) {
    }

    #[Endpoint(title: 'List Chat Conversations')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    #[Response(
        status: 200,
        examples: [[
            'data' => [[
                'id' => 12,
                'tutor_user_id' => 2,
                'student_user_id' => 5,
                'start_date' => '2026-03-01',
                'end_date' => '2026-03-30',
                'tutor' => [
                    'id' => 2,
                    'name' => 'Jane Tutor',
                ],
                'student' => [
                    'id' => 5,
                    'name' => 'John Student',
                ],
                'last_message' => [
                    'id' => 321,
                    'conversation_id' => 12,
                    'sender_id' => 5,
                    'sender_name' => 'John Student',
                    'content' => 'When is our next class?',
                    'created_at' => '2026-03-05T10:00:00.000000Z',
                    'updated_at' => '2026-03-05T10:00:00.000000Z',
                ],
                'created_at' => '2026-03-01T00:00:00.000000Z',
                'updated_at' => '2026-03-05T10:01:00.000000Z',
            ]],
            'current_page' => 1,
            'total_page' => 1,
            'total_items' => 1,
        ]],
    )]
    public function listConversations(Request $request): AnonymousResourceCollection
    {
        $userId = (int) $request->user()->id;
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $perPage = $this->chatService->sanitizePerPage((int) ($validated['per_page'] ?? ChatService::DEFAULT_PER_PAGE));

        $conversations = $this->chatService->listConversations($userId, $perPage);

        return ChatConversationResource::collection($conversations)->additional($this->paginationMeta($conversations));
    }

    #[Endpoint(title: 'List Chat Messages')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    #[Response(
        status: 200,
        examples: [[
            'data' => [[
                'id' => 321,
                'conversation_id' => 12,
                'sender_id' => 5,
                'sender_name' => 'John Student',
                'content' => 'When is our next class?',
                'created_at' => '2026-03-05T10:00:00.000000Z',
                'updated_at' => '2026-03-05T10:00:00.000000Z',
            ]],
            'current_page' => 1,
            'total_page' => 1,
            'total_items' => 1,
        ]],
    )]
    public function listMessages(Request $request, TutorAssignment $conversation): AnonymousResourceCollection
    {
        $userId = (int) $request->user()->id;
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $perPage = $this->chatService->sanitizePerPage((int) ($validated['per_page'] ?? ChatService::DEFAULT_PER_PAGE));

        $messages = $this->chatService->listMessages($userId, $conversation, $perPage);

        return ChatMessageResource::collection($messages)->additional($this->paginationMeta($messages));
    }

    #[Endpoint(title: 'Send Chat Message')]
    #[BodyParameter('content', required: true, example: 'What time is our next class?')]
    #[Response(
        status: 200,
        examples: [[
            'id' => 322,
            'conversation_id' => 12,
            'sender_id' => 2,
            'sender_name' => 'Jane Tutor',
            'content' => 'Our next class starts at 14:00.',
            'created_at' => '2026-03-05T10:15:00.000000Z',
            'updated_at' => '2026-03-05T10:15:00.000000Z',
        ]],
    )]
    public function sendMessage(Request $request, TutorAssignment $conversation): ChatMessageResource
    {
        $userId = (int) $request->user()->id;
        $data = $request->validate([
            'content' => ['required', 'string', 'max:5000'],
        ]);

        $message = $this->chatService->sendMessage($userId, $conversation, $data['content']);

        return new ChatMessageResource($message);
    }

    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'total_page' => $paginator->lastPage(),
            'total_items' => $paginator->total(),
        ];
    }
}

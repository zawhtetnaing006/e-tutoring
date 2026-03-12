<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\ChatDocumentCommentResource;
use App\Http\Resources\ChatDocumentResource;
use App\Http\Resources\ChatUserResource;
use App\Http\Resources\ChatMessageResource;
use App\Http\Resources\ChatConversationResource;
use App\Models\Conversation;
use App\Models\Document;
use App\Models\User;
use App\Services\ChatService;
use App\Traits\FormatsListingResponse;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Chat', description: 'Chat conversations and messages.', weight: 7)]
class ChatController
{
    use FormatsListingResponse;

    public function __construct(
        private readonly ChatService $chatService,
    ) {
    }

    #[Endpoint(title: 'List Conversations')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    #[Response(
        status: 200,
        examples: [[
            'data' => [[
                'id' => 12,
                'members' => [[
                    'id' => 2,
                    'name' => 'Jane Tutor',
                    'email' => 'jane@example.com',
                    'roles' => ['TUTOR'],
                ], [
                    'id' => 5,
                    'name' => 'John Student',
                    'email' => 'john@example.com',
                    'roles' => ['STUDENT'],
                ]],
                'last_message' => [
                    'id' => 321,
                    'conversation_id' => 12,
                    'sender_id' => 5,
                    'sender_name' => 'John Student',
                    'content' => 'When is our next class?',
                    'created_at' => '2026-03-05T10:00:00.000000Z',
                    'updated_at' => '2026-03-05T10:00:00.000000Z',
                ],
                'created_at' => '2026-03-04T00:00:00.000000Z',
                'updated_at' => '2026-03-05T10:01:00.000000Z',
            ]],
            'current_page' => 1,
            'total_page' => 1,
            'total_items' => 1,
        ]],
    )]
    public function listConversations(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $perPage = $this->chatService->sanitizePerPage((int) ($validated['per_page'] ?? ChatService::DEFAULT_PER_PAGE));

        /** @var \Illuminate\Pagination\LengthAwarePaginator $conversations */
        $conversations = $this->chatService->listConversations($request->user(), $perPage);
        $data = $conversations->getCollection()
            ->map(fn ($conversation) => (new ChatConversationResource($conversation))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($conversations, $data);
    }

    #[Endpoint(title: 'Search Chat Users')]
    #[QueryParameter('search', required: true, example: 'jane')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    public function searchChatUsers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['required', 'string', 'min:1', 'max:255'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $perPage = $this->chatService->sanitizePerPage((int) ($validated['per_page'] ?? ChatService::DEFAULT_PER_PAGE));

        /** @var \Illuminate\Pagination\LengthAwarePaginator $users */
        $users = $this->chatService->searchChatUsers(
            $request->user(),
            $validated['search'],
            $perPage
        );
        $data = $users->getCollection()
            ->map(fn ($user) => (new ChatUserResource($user))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($users, $data);
    }

    #[Endpoint(title: 'Start Conversation')]
    #[BodyParameter('target_user_id', required: true, example: 5)]
    public function startConversation(Request $request): ChatConversationResource
    {
        $data = $request->validate([
            'target_user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $targetUser = User::query()->findOrFail($data['target_user_id']);
        $conversation = $this->chatService->createOrGetConversation(
            $request->user(),
            $targetUser
        );

        return new ChatConversationResource($conversation);
    }

    #[Endpoint(title: 'List Messages')]
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
    public function listMessages(Request $request, Conversation $conversation): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $perPage = $this->chatService->sanitizePerPage((int) ($validated['per_page'] ?? ChatService::DEFAULT_PER_PAGE));

        /** @var \Illuminate\Pagination\LengthAwarePaginator $messages */
        $messages = $this->chatService->listMessages($request->user(), $conversation, $perPage);
        $data = $messages->getCollection()
            ->map(fn ($message) => (new ChatMessageResource($message))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($messages, $data);
    }

    #[Endpoint(title: 'Send Message')]
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
    public function sendMessage(Request $request, Conversation $conversation): ChatMessageResource
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:5000'],
        ]);

        $message = $this->chatService->sendMessage($request->user(), $conversation, $data['content']);

        return new ChatMessageResource($message);
    }

    #[Endpoint(title: 'List Shared Documents')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    public function listSharedDocuments(Request $request, Conversation $conversation): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $perPage = $this->chatService->sanitizePerPage((int) ($validated['per_page'] ?? ChatService::DEFAULT_PER_PAGE));

        /** @var \Illuminate\Pagination\LengthAwarePaginator $documents */
        $documents = $this->chatService->listSharedDocuments($request->user(), $conversation, $perPage);
        $data = $documents->getCollection()
            ->map(fn ($document) => (new ChatDocumentResource($document))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($documents, $data);
    }

    #[Endpoint(title: 'Upload Shared Document')]
    #[BodyParameter('file', required: true)]
    public function uploadSharedDocument(Request $request, Conversation $conversation): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:51200'],
        ]);

        $document = $this->chatService->uploadSharedDocument(
            $request->user(),
            $conversation,
            $data['file']
        );

        return response()->json(new ChatDocumentResource($document), 201);
    }

    #[Endpoint(title: 'List Document Comments')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    public function listDocumentComments(Request $request, Document $document): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $perPage = $this->chatService->sanitizePerPage((int) ($validated['per_page'] ?? ChatService::DEFAULT_PER_PAGE));

        /** @var \Illuminate\Pagination\LengthAwarePaginator $comments */
        $comments = $this->chatService->listDocumentComments($request->user(), $document, $perPage);
        $data = $comments->getCollection()
            ->map(fn ($comment) => (new ChatDocumentCommentResource($comment))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($comments, $data);
    }

    #[Endpoint(title: 'Add Document Comment')]
    #[BodyParameter('comment', required: true, example: 'Please review section 2 again.')]
    public function addDocumentComment(Request $request, Document $document): JsonResponse
    {
        $data = $request->validate([
            'comment' => ['required', 'string', 'max:5000'],
        ]);

        $comment = $this->chatService->addDocumentComment(
            $request->user(),
            $document,
            $data['comment']
        );

        return response()->json(new ChatDocumentCommentResource($comment), 201);
    }
}

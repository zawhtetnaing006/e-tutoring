<?php

namespace App\Http\Controllers\Api;

use App\Traits\FormatsListingResponse;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Notifications', description: 'Notification endpoints.', weight: 4)]
class NotificationController
{
    use FormatsListingResponse;

    #[Endpoint(title: 'List My Notifications')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    #[Response(
        status: 200,
        examples: [[
            'data' => [[
                'id' => 1,
                'user_id' => 10,
                'status' => 'SENT',
                'is_read' => false,
                'sent_at' => '2026-02-23T10:10:00.000000Z',
                'created_at' => '2026-02-23T10:09:00.000000Z',
            ]],
            'current_page' => 1,
            'total_page' => 1,
            'total_items' => 1,
        ]],
    )]
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $page = max(1, (int) $request->integer('page', 1));

        $notifications = Notification::query()
            ->where('user_id', (int) $request->user()->id)
            ->latest('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $notifications->getCollection()
            ->map(fn (Notification $notification) => (new NotificationResource($notification))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($notifications, $data);
    }
}

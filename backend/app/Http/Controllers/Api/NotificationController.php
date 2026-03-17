<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\NotificationResource;
use App\Traits\FormatsListingResponse;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

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
                'id' => '8f2c7e4d-7b4e-46de-85be-530fbe1fcf30',
                'type' => 'new_message',
                'is_read' => false,
                'created_at' => '2026-03-17T10:09:00.000000Z',
                'title' => 'New Message',
                'body' => 'Tutor User sent you a message.',
                'action' => [
                    'route' => '/communication-hub',
                    'conversation_id' => 12,
                ],
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

        $notifications = $request->user()
            ->notifications()
            ->latest('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $notifications->getCollection()
            ->map(fn(DatabaseNotification $notification) => (new NotificationResource($notification))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($notifications, $data);
    }

    #[Endpoint(title: 'Mark Notification As Read')]
    #[Response(
        status: 200,
        examples: [[
            'id' => '8f2c7e4d-7b4e-46de-85be-530fbe1fcf30',
            'type' => 'new_message',
            'is_read' => true,
            'created_at' => '2026-03-17T10:09:00.000000Z',
            'title' => 'New Message',
            'body' => 'Tutor User sent you a message.',
            'action' => [
                'route' => '/communication-hub',
                'conversation_id' => 12,
            ],
        ]],
    )]
    public function markAsRead(Request $request, string $notificationId): NotificationResource
    {
        $notification = $this->resolveUserNotification($request, $notificationId);

        if ($notification->read_at === null) {
            $notification->markAsRead();
            $notification->refresh();
        }

        return new NotificationResource($notification);
    }

    #[Endpoint(title: 'Mark All Notifications As Read')]
    #[Response(
        status: 200,
        examples: [[
            'message' => 'Notifications marked as read.',
            'marked_count' => 3,
        ]],
    )]
    public function markAllAsRead(Request $request): JsonResponse
    {
        $markedCount = $request->user()
            ->unreadNotifications()
            ->count();

        if ($markedCount > 0) {
            $request->user()
                ->unreadNotifications()
                ->update([
                    'read_at' => now(),
                    'updated_at' => now(),
                ]);
        }

        return response()->json([
            'message' => 'Notifications marked as read.',
            'marked_count' => $markedCount,
        ]);
    }

    #[Endpoint(title: 'Get Unread Notification Count')]
    #[Response(
        status: 200,
        examples: [[
            'count' => 4,
        ]],
    )]
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => $request->user()
                ->unreadNotifications()
                ->count(),
        ]);
    }

    private function resolveUserNotification(Request $request, string $notificationId): DatabaseNotification
    {
        $notification = $request->user()
            ->notifications()
            ->whereKey($notificationId)
            ->first();

        if (! $notification instanceof DatabaseNotification) {
            throw (new ModelNotFoundException())->setModel(DatabaseNotification::class, [$notificationId]);
        }

        return $notification;
    }
}

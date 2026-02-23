<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\NotiResource;
use App\Models\Noti;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Notifications', description: 'Notification endpoints.', weight: 4)]
class NotiController
{
    #[Endpoint(title: 'List My Notifications')]
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
        ]],
    )]
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));

        $notis = Noti::query()
            ->where('user_id', (int) $request->user()->id)
            ->latest('id')
            ->paginate($perPage);

        return NotiResource::collection($notis)->response();
    }
}

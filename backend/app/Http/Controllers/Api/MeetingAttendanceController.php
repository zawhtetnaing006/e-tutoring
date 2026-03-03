<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\MeetingAttendance\StoreMeetingAttendanceRequest;
use App\Http\Resources\MeetingAttendanceResource;
use App\Models\MeetingAttendee;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;

#[Group('Meeting Attendances', description: 'Meeting attendance management endpoints.', weight: 9)]
class MeetingAttendanceController
{
    #[Endpoint(title: 'Create Meeting Attendance')]
    #[BodyParameter('meeting_id', required: true, example: 1)]
    #[BodyParameter('user_id', required: true, example: 5)]
    #[BodyParameter('status', required: true, example: 'presence')]
    #[Response(status: 201, examples: [[
        'id' => 1,
        'meeting_id' => 1,
        'user_id' => 5,
        'status' => 'presence',
        'created_at' => '2026-03-03T00:00:00.000000Z',
        'updated_at' => '2026-03-03T00:00:00.000000Z',
    ]])]
    public function store(StoreMeetingAttendanceRequest $request): JsonResponse
    {
        $attendance = MeetingAttendee::query()->create($request->validated());

        return response()->json(new MeetingAttendanceResource($attendance), 201);
    }
}

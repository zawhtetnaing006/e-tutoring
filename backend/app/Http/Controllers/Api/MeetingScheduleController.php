<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Meeting\UpdateMeetingScheduleRequest;
use App\Http\Resources\MeetingScheduleResource;
use App\Models\MeetingSchedule;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;

#[Group('Meeting Schedules', description: 'Meeting schedule management endpoints.', weight: 8)]
class MeetingScheduleController
{
    #[Endpoint(title: 'Update Meeting Schedule')]
    #[BodyParameter('date', required: false, example: '2026-03-10')]
    #[BodyParameter('start_time', required: false, example: '10:00')]
    #[BodyParameter('end_time', required: false, example: '11:00')]
    #[BodyParameter('note', required: false, example: 'Bring chapter 5 worksheet')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'meeting_id' => 1,
        'date' => '2026-03-10',
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'note' => 'Bring chapter 5 worksheet',
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-02T00:00:00.000000Z',
    ]])]
    public function update(UpdateMeetingScheduleRequest $request, MeetingSchedule $meetingSchedule): JsonResponse
    {
        $meetingSchedule->update($request->validated());

        return response()->json(new MeetingScheduleResource($meetingSchedule->fresh()));
    }
}

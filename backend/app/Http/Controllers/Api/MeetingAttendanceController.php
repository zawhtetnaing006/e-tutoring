<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\MeetingAttendance\StoreMeetingAttendanceRequest;
use App\Http\Resources\MeetingAttendanceResource;
use App\Models\MeetingAttendee;
use App\Services\AuditLogService;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Meeting Attendances', description: 'Meeting attendance management endpoints.', weight: 9)]
class MeetingAttendanceController
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    )
    {
    }

    #[Endpoint(title: 'Create Meeting Attendance')]
    #[BodyParameter('meeting_id', required: true, example: 1)]
    #[BodyParameter('user_id', required: true, example: 5)]
    #[BodyParameter('status', required: true, example: 'PRESENCE')]
    #[Response(status: 201, examples: [[
        'id' => 1,
        'meeting_id' => 1,
        'user_id' => 5,
        'status' => 'PRESENCE',
        'created_at' => '2026-03-03T00:00:00.000000Z',
        'updated_at' => '2026-03-03T00:00:00.000000Z',
    ]])]
    public function store(StoreMeetingAttendanceRequest $request): JsonResponse
    {
        $attendance = MeetingAttendee::query()->create($request->validated());
        $targetLabel = $this->meetingAttendanceTargetLabel($attendance);

        $this->auditLogService->log(
            request: $request,
            description: 'meeting_attendance.created',
            subject: $attendance,
            properties: [
                'meta' => [
                    'action_label' => 'RECORD_MEETING_ATTENDANCE',
                    'target_label' => $targetLabel,
                    'description' => sprintf('Recorded attendance for %s.', $targetLabel),
                ],
            ],
            event: 'created',
        );

        return response()->json(new MeetingAttendanceResource($attendance), 201);
    }

    private function meetingAttendanceTargetLabel(MeetingAttendee $attendance): string
    {
        return sprintf('MeetingAttendance#%d', (int) $attendance->id);
    }
}

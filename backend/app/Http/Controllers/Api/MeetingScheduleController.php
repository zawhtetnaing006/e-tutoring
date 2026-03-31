<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Meeting\UpdateMeetingScheduleRequest;
use App\Http\Resources\MeetingScheduleResource;
use App\Models\MeetingSchedule;
use App\Services\AuditLogService;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

#[Group('Meeting Schedules', description: 'Meeting schedule management endpoints.', weight: 8)]
class MeetingScheduleController
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    )
    {
    }

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
        $meetingSchedule->loadMissing('meeting.tutorAssignment');
        Gate::authorize('update', $meetingSchedule->meeting);

        $before = $this->meetingScheduleAuditAttributes($meetingSchedule);
        $meetingSchedule->update($request->validated());
        $freshMeetingSchedule = $meetingSchedule->fresh();
        $changes = $this->auditLogService->diff($before, $this->meetingScheduleAuditAttributes($freshMeetingSchedule));

        if ($changes['old'] !== [] || $changes['attributes'] !== []) {
            $targetLabel = $this->meetingScheduleTargetLabel($freshMeetingSchedule);

            $this->auditLogService->log(
                request: $request,
                description: 'meeting_schedule.updated',
                subject: $freshMeetingSchedule,
                properties: [
                    'old' => $changes['old'],
                    'attributes' => $changes['attributes'],
                    'meta' => [
                        'action_label' => 'UPDATE_MEETING_SCHEDULE',
                        'target_label' => $targetLabel,
                        'description' => $this->meetingScheduleUpdatedDescription($targetLabel, $changes),
                    ],
                ],
                event: 'updated',
            );
        }

        return response()->json(new MeetingScheduleResource($freshMeetingSchedule));
    }

    #[Endpoint(title: 'Cancel Meeting Schedule')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'meeting_id' => 1,
        'date' => '2026-03-10',
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'note' => 'Bring chapter 5 worksheet',
        'cancel_at' => '2026-03-03T08:00:00.000000Z',
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-03T08:00:00.000000Z',
    ]])]
    public function cancel(Request $request, MeetingSchedule $meetingSchedule): JsonResponse
    {
        $meetingSchedule->loadMissing('meeting.tutorAssignment');
        Gate::authorize('update', $meetingSchedule->meeting);

        $before = $this->meetingScheduleAuditAttributes($meetingSchedule);

        if ($meetingSchedule->cancel_at === null) {
            $meetingSchedule->update([
                'cancel_at' => now(),
            ]);
        }

        $freshMeetingSchedule = $meetingSchedule->fresh();
        $targetLabel = $this->meetingScheduleTargetLabel($freshMeetingSchedule);

        $this->auditLogService->log(
            request: $request,
            description: 'meeting_schedule.cancelled',
            subject: $freshMeetingSchedule,
            properties: [
                'old' => [
                    'cancel_at' => $before['cancel_at'],
                ],
                'attributes' => [
                    'cancel_at' => $freshMeetingSchedule->cancel_at?->toISOString(),
                ],
                'meta' => [
                    'action_label' => 'CANCEL_MEETING_SCHEDULE',
                    'target_label' => $targetLabel,
                    'description' => sprintf('Cancelled %s.', $targetLabel),
                ],
            ],
            event: 'updated',
        );

        return response()->json(new MeetingScheduleResource($freshMeetingSchedule));
    }

    /**
     * @return array<string, mixed>
     */
    private function meetingScheduleAuditAttributes(MeetingSchedule $meetingSchedule): array
    {
        return [
            'id' => $meetingSchedule->id,
            'meeting_id' => $meetingSchedule->meeting_id,
            'date' => $meetingSchedule->date,
            'start_time' => $meetingSchedule->start_time,
            'end_time' => $meetingSchedule->end_time,
            'note' => $meetingSchedule->note,
            'cancel_at' => $meetingSchedule->cancel_at?->toISOString(),
        ];
    }

    private function meetingScheduleTargetLabel(MeetingSchedule $meetingSchedule): string
    {
        return sprintf('Meeting Schedule#%d', (int) $meetingSchedule->id);
    }

    /**
     * @param  array{old: array<string, mixed>, attributes: array<string, mixed>}  $changes
     */
    private function meetingScheduleUpdatedDescription(string $targetLabel, array $changes): string
    {
        $fields = array_values(array_unique([
            ...array_keys($changes['old']),
            ...array_keys($changes['attributes']),
        ]));

        if ($fields === []) {
            return sprintf('Updated %s.', $targetLabel);
        }

        $labels = array_map(
            static fn (string $field): string => strtolower(str_replace('_', ' ', $field)),
            $fields,
        );

        return sprintf('Updated %s: %s.', $targetLabel, implode(', ', $labels));
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Meeting\UpdateMeetingScheduleRequest;
use App\Http\Resources\MeetingScheduleResource;
use App\Models\MeetingSchedule;
use App\Models\User;
use App\Notifications\MeetingScheduleCancelledNotification;
use App\Notifications\MeetingScheduleUpdatedNotification;
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
            $changedFields = $this->changedFields($changes);

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

            $this->meetingScheduleRecipients($freshMeetingSchedule, $request->user())
                ->each(fn (User $recipient) => $recipient->notify(
                    new MeetingScheduleUpdatedNotification($freshMeetingSchedule, $changedFields)
                ));
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
        if ($before['cancel_at'] === null && $freshMeetingSchedule->cancel_at !== null) {
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

            $this->meetingScheduleRecipients($freshMeetingSchedule, $request->user())
                ->each(fn (User $recipient) => $recipient->notify(
                    new MeetingScheduleCancelledNotification($freshMeetingSchedule)
                ));
        }

        return response()->json(new MeetingScheduleResource($freshMeetingSchedule));
    }

    /**
     * @param  array{old: array<string, mixed>, attributes: array<string, mixed>}  $changes
     * @return list<string>
     */
    private function changedFields(array $changes): array
    {
        return array_values(array_unique([
            ...array_keys($changes['old']),
            ...array_keys($changes['attributes']),
        ]));
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
        return sprintf('MeetingSchedule#%d', (int) $meetingSchedule->id);
    }

    /**
     * @param  array{old: array<string, mixed>, attributes: array<string, mixed>}  $changes
     */
    private function meetingScheduleUpdatedDescription(string $targetLabel, array $changes): string
    {
        $fields = $this->changedFields($changes);

        if ($fields === []) {
            return sprintf('Updated %s.', $targetLabel);
        }

        $labels = array_map(
            static fn (string $field): string => strtolower(str_replace('_', ' ', $field)),
            $fields,
        );

        return sprintf('Updated %s: %s.', $targetLabel, implode(', ', $labels));
    }

    /**
     * @return \Illuminate\Support\Collection<int, User>
     */
    private function meetingScheduleRecipients(MeetingSchedule $meetingSchedule, ?User $actor): \Illuminate\Support\Collection
    {
        $meetingSchedule->loadMissing([
            'meeting.tutorAssignment.tutor:id',
            'meeting.tutorAssignment.student:id',
        ]);

        return collect([
            $meetingSchedule->meeting?->tutorAssignment?->tutor,
            $meetingSchedule->meeting?->tutorAssignment?->student,
        ])->filter(fn (mixed $recipient): bool => $recipient instanceof User)
            ->reject(fn (User $recipient): bool => $actor !== null && (int) $recipient->id === (int) $actor->id)
            ->unique(fn (User $recipient): int => (int) $recipient->id)
            ->values();
    }
}

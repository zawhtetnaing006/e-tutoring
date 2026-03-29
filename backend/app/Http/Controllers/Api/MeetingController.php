<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Meeting\StoreMeetingRequest;
use App\Http\Requests\Meeting\UpdateMeetingRequest;
use App\Http\Resources\MeetingResource;
use App\Models\Meeting;
use App\Models\Role;
use App\Models\User;
use App\Notifications\NewScheduleAssigned;
use App\Services\AuditLogService;
use App\Traits\FormatsListingResponse;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

#[Group('Meetings', description: 'Meeting management endpoints.', weight: 7)]
class MeetingController
{
    use FormatsListingResponse;

    public function __construct(
        private readonly AuditLogService $auditLogService
    )
    {
    }

    #[Endpoint(title: 'List Meetings')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    #[Response(status: 200, examples: [[
        'data' => [[
            'id' => 1,
            'title' => 'Math Session',
            'description' => 'Weekly tutoring',
            'type' => 'VIRTUAL',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/abc',
            'location' => null,
            'tutor_assignment_id' => 1,
            'meeting_schedules' => [[
                'id' => 1,
                'meeting_id' => 1,
                'date' => '2026-03-10',
                'start_time' => '09:00:00',
                'end_time' => '10:00:00',
                'note' => 'Focus on algebra practice.',
                'created_at' => '2026-03-01T00:00:00.000000Z',
                'updated_at' => '2026-03-01T00:00:00.000000Z',
            ]],
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ]],
        'current_page' => 1,
        'total_page' => 1,
        'total_items' => 1,
    ]])]
    public function index(Request $request): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $request->user();
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $page = max(1, (int) $request->integer('page', 1));

        $meetings = Meeting::query()
            ->with(['schedules' => fn ($query) => $query->orderBy('date')->orderBy('start_time')])
            ->when($currentUser?->hasRole(Role::TUTOR), function ($query) use ($currentUser) {
                $query->whereHas('tutorAssignment', function ($assignmentQuery) use ($currentUser): void {
                    $assignmentQuery->where('tutor_user_id', (int) $currentUser->id);
                });
            })
            ->latest('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $meetings->getCollection()
            ->map(fn (Meeting $meeting) => (new MeetingResource($meeting))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($meetings, $data);
    }

    #[Endpoint(title: 'Create Meeting')]
    #[BodyParameter('title', required: true, example: 'Math Session')]
    #[BodyParameter('description', required: false, example: 'Weekly tutoring')]
    #[BodyParameter('type', required: true, example: 'VIRTUAL')]
    #[BodyParameter('platform', required: false, example: 'Google Meet')]
    #[BodyParameter('link', required: false, example: 'https://meet.example.com/abc')]
    #[BodyParameter('location', required: false, example: null)]
    #[BodyParameter('tutor_assignment_id', required: true, example: 1)]
    #[BodyParameter('meeting_schedules', required: true, example: [
        ['date' => '2026-03-10', 'start_time' => '09:00', 'end_time' => '10:00'],
        ['date' => '2026-03-12', 'start_time' => '09:00', 'end_time' => '10:00'],
    ])]
    #[Response(status: 201, examples: [[
        'id' => 1,
        'title' => 'Math Session',
        'description' => 'Weekly tutoring',
        'type' => 'VIRTUAL',
        'platform' => 'Google Meet',
        'link' => 'https://meet.example.com/abc',
        'location' => null,
        'tutor_assignment_id' => 1,
        'meeting_schedules' => [[
            'id' => 1,
            'meeting_id' => 1,
            'date' => '2026-03-10',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'note' => 'Focus on algebra practice.',
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ]],
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-01T00:00:00.000000Z',
    ]])]
    public function store(StoreMeetingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $meeting = DB::transaction(function () use ($validated): Meeting {
            $meeting = Meeting::query()->create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'platform' => $validated['platform'] ?? null,
                'link' => $validated['link'] ?? null,
                'location' => $validated['location'] ?? null,
                'tutor_assignment_id' => (int) $validated['tutor_assignment_id'],
            ]);

            $meeting->schedules()->createMany(array_map(
                static fn (array $schedule): array => [
                    'date' => $schedule['date'],
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time'],
                ],
                $validated['meeting_schedules']
            ));

            return $meeting;
        });

        $meeting->load([
            'schedules' => fn ($query) => $query->orderBy('date')->orderBy('start_time'),
            'tutorAssignment.tutor',
            'tutorAssignment.student',
        ]);

        collect([
            $meeting->tutorAssignment?->tutor,
            $meeting->tutorAssignment?->student,
        ])
            ->filter()
            ->unique(fn (User $recipient): int => (int) $recipient->id)
            ->each(fn (User $recipient) => $recipient->notify(new NewScheduleAssigned($meeting)));

        $targetLabel = $this->meetingTargetLabel($meeting);

        $this->auditLogService->log(
            request: $request,
            description: 'meeting.created',
            subject: $meeting,
            properties: [
                'meta' => [
                    'action_label' => 'CREATE_MEETING',
                    'target_label' => $targetLabel,
                    'description' => sprintf('Created %s.', $targetLabel),
                ],
            ],
            event: 'created',
        );

        return response()->json(
            new MeetingResource($meeting),
            201
        );
    }

    #[Endpoint(title: 'Get Meeting')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'title' => 'Math Session',
        'description' => 'Weekly tutoring',
        'type' => 'VIRTUAL',
        'platform' => 'Google Meet',
        'link' => 'https://meet.example.com/abc',
        'location' => null,
        'tutor_assignment_id' => 1,
        'meeting_schedules' => [[
            'id' => 1,
            'meeting_id' => 1,
            'date' => '2026-03-10',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'note' => 'Focus on algebra practice.',
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ]],
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-01T00:00:00.000000Z',
    ]])]
    public function show(Meeting $meeting): JsonResponse
    {
        return response()->json(new MeetingResource(
            $meeting->load(['schedules' => fn ($query) => $query->orderBy('date')->orderBy('start_time')])
        ));
    }

    #[Endpoint(title: 'Update Meeting')]
    #[BodyParameter('title', required: false, example: 'Math Session - Updated')]
    #[BodyParameter('description', required: false, example: 'Updated detail')]
    #[BodyParameter('type', required: false, example: 'PHYSICAL')]
    #[BodyParameter('platform', required: false, example: 'Campus Room A')]
    #[BodyParameter('link', required: false, example: null)]
    #[BodyParameter('location', required: false, example: 'Building A, Room 203')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'title' => 'Math Session - Updated',
        'description' => 'Updated detail',
        'type' => 'PHYSICAL',
        'platform' => 'Campus Room A',
        'link' => null,
        'location' => 'Building A, Room 203',
        'tutor_assignment_id' => 1,
        'meeting_schedules' => [[
            'id' => 1,
            'meeting_id' => 1,
            'date' => '2026-03-10',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'note' => 'Bring chapter 5 worksheet',
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ]],
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-02T00:00:00.000000Z',
    ]])]
    public function update(UpdateMeetingRequest $request, Meeting $meeting): JsonResponse
    {
        $before = $this->meetingAuditAttributes($meeting);
        $meeting->update($request->validated());
        $freshMeeting = $meeting->fresh()->load(['schedules' => fn ($query) => $query->orderBy('date')->orderBy('start_time')]);
        $changes = $this->auditLogService->diff($before, $this->meetingAuditAttributes($freshMeeting));

        if ($changes['old'] !== [] || $changes['attributes'] !== []) {
            $targetLabel = $this->meetingTargetLabel($freshMeeting);

            $this->auditLogService->log(
                request: $request,
                description: 'meeting.updated',
                subject: $freshMeeting,
                properties: [
                    'old' => $changes['old'],
                    'attributes' => $changes['attributes'],
                    'meta' => [
                        'action_label' => 'UPDATE_MEETING',
                        'target_label' => $targetLabel,
                        'description' => $this->meetingUpdatedDescription($targetLabel, $changes),
                    ],
                ],
                event: 'updated',
            );
        }

        return response()->json(new MeetingResource(
            $freshMeeting
        ));
    }

    #[Endpoint(title: 'Delete Meeting')]
    #[Response(status: 204, examples: [[null]])]
    public function destroy(Request $request, Meeting $meeting): JsonResponse
    {
        $targetLabel = $this->meetingTargetLabel($meeting);
        $meeting->delete();

        $this->auditLogService->log(
            request: $request,
            description: 'meeting.deleted',
            subject: $meeting,
            properties: [
                'meta' => [
                    'action_label' => 'DELETE_MEETING',
                    'target_label' => $targetLabel,
                    'description' => sprintf('Deleted %s.', $targetLabel),
                ],
            ],
            event: 'deleted',
        );

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function meetingAuditAttributes(Meeting $meeting): array
    {
        $loadedMeeting = $meeting->loadMissing([
            'schedules' => fn ($query) => $query->orderBy('date')->orderBy('start_time'),
        ]);

        return [
            'title' => $loadedMeeting->title,
            'description' => $loadedMeeting->description,
            'type' => $loadedMeeting->type,
            'platform' => $loadedMeeting->platform,
            'link' => $loadedMeeting->link,
            'location' => $loadedMeeting->location,
            'tutor_assignment_id' => $loadedMeeting->tutor_assignment_id,
        ];
    }

    private function meetingTargetLabel(Meeting $meeting): string
    {
        return sprintf('Meeting#%d', (int) $meeting->id);
    }

    /**
     * @param  array{old: array<string, mixed>, attributes: array<string, mixed>}  $changes
     */
    private function meetingUpdatedDescription(string $targetLabel, array $changes): string
    {
        $fields = array_values(array_unique([
            ...array_keys($changes['old']),
            ...array_keys($changes['attributes']),
        ]));

        if ($fields === []) {
            return sprintf('Updated %s.', $targetLabel);
        }

        $labels = array_map(
            static fn (string $field): string => $field === 'tutor_assignment_id'
                ? 'tutor assignment'
                : strtolower(str_replace('_', ' ', $field)),
            $fields,
        );

        return sprintf('Updated %s: %s.', $targetLabel, implode(', ', $labels));
    }
}

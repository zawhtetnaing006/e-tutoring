<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\TutorAssignment\ExportTutorAssignmentsRequest;
use App\Http\Requests\TutorAssignment\StoreTutorAssignmentRequest;
use App\Http\Requests\TutorAssignment\UpdateTutorAssignmentRequest;
use App\Http\Resources\TutorAssignmentResource;
use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use App\Notifications\TutorAssignmentCreatedNotification;
use App\Services\AuditLogService;
use App\Services\ChatService;
use App\Services\TutorAssignmentExportService;
use App\Traits\FormatsListingResponse;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

#[Group('Tutor Assignments', description: 'Tutor assignment management endpoints.', weight: 6)]
class TutorAssignmentController
{
    use FormatsListingResponse;

    public function __construct(
        private readonly ChatService $chatService,
        private readonly AuditLogService $auditLogService,
        private readonly TutorAssignmentExportService $tutorAssignmentExportService,
    ) {
    }

    #[Endpoint(title: 'List Tutor Assignments')]
    #[QueryParameter('only_mine', required: false, example: true)]
    #[QueryParameter('search', required: false, example: 'John')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    #[Response(status: 200, examples: [[
        'data' => [[
            'id' => 1,
            'tutor_user_id' => 2,
            'student_user_id' => 5,
            'from_date' => '2026-03-01',
            'to_date' => '2026-03-30',
            'status' => 'ACTIVE',
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ]],
        'current_page' => 1,
        'total_page' => 1,
        'total_items' => 1,
    ]])]
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'only_mine' => ['sometimes', 'boolean'],
            'search' => ['sometimes', 'string'],
        ]);

        /** @var User|null $currentUser */
        $currentUser = $request->user();

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $page = max(1, (int) $request->integer('page', 1));
        $onlyMine = (bool) ($data['only_mine'] ?? false);
        $search = trim((string) ($data['search'] ?? ''));

        $query = TutorAssignment::query();

        if ($onlyMine && $currentUser !== null && ! $currentUser->hasRole(Role::STAFF)) {
            $query->where(function ($builder) use ($currentUser): void {
                $hasScopedRole = false;

                if ($currentUser->hasRole(Role::TUTOR)) {
                    $builder->where('tutor_user_id', (int) $currentUser->id);
                    $hasScopedRole = true;
                }

                if ($currentUser->hasRole(Role::STUDENT)) {
                    if ($hasScopedRole) {
                        $builder->orWhere('student_user_id', (int) $currentUser->id);
                    } else {
                        $builder->where('student_user_id', (int) $currentUser->id);
                        $hasScopedRole = true;
                    }
                }

                if (! $hasScopedRole) {
                    $builder->whereRaw('1 = 0');
                }
            });
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->whereHas('student', function ($userQuery) use ($search): void {
                        $userQuery->where('name', 'like', '%' . $search . '%');
                    })
                    ->orWhereHas('tutor', function ($userQuery) use ($search): void {
                        $userQuery->where('name', 'like', '%' . $search . '%');
                    });
            });
        }

        $tutorAssignments = $query
            ->latest('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $tutorAssignments->getCollection()
            ->map(fn (TutorAssignment $tutorAssignment) => (new TutorAssignmentResource($tutorAssignment))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($tutorAssignments, $data);
    }

    #[Endpoint(title: 'Create Tutor Assignments')]
    #[BodyParameter('tutor_user_id', required: true, example: 2)]
    #[BodyParameter('student_user_ids', required: true, example: [5, 9])]
    #[BodyParameter('from_date', required: true, example: '2026-03-01')]
    #[BodyParameter('to_date', required: true, example: '2026-03-30')]
    #[BodyParameter('status', required: false, example: 'ACTIVE')]
    #[Response(status: 201, examples: [[
        [
            'id' => 1,
            'tutor_user_id' => 2,
            'student_user_id' => 5,
            'from_date' => '2026-03-01',
            'to_date' => '2026-03-30',
            'status' => 'ACTIVE',
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ],
        [
            'id' => 2,
            'tutor_user_id' => 2,
            'student_user_id' => 9,
            'from_date' => '2026-03-01',
            'to_date' => '2026-03-30',
            'status' => 'ACTIVE',
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ],
    ]])]
    public function store(StoreTutorAssignmentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $tutorUserId = (int) $validated['tutor_user_id'];
        $studentUserIds = $validated['student_user_ids'];
        $fromDate = (string) $validated['from_date'];
        $toDate = (string) $validated['to_date'];
        $status = $validated['status'] ?? null;

        // If no status is provided, determine it from the current date window.
        if ($status === null) {
            $status = TutorAssignment::resolveStatusForDate($fromDate, $toDate);
        }

        $created = DB::transaction(function () use ($tutorUserId, $studentUserIds, $fromDate, $toDate, $status): array {
            $records = [];

            foreach ($studentUserIds as $studentUserId) {
                $records[] = TutorAssignment::query()->create([
                    'tutor_user_id' => $tutorUserId,
                    'student_user_id' => (int) $studentUserId,
                    'start_date' => $fromDate,
                    'end_date' => $toDate,
                    'status' => $status,
                ]);
            }

            return $records;
        });

        if ($status === TutorAssignment::STATUS_ACTIVE) {
            foreach ($created as $assignment) {
                $this->chatService->ensureAssignmentWelcomeConversation($assignment);
            }
        }

        $loadedAssignments = collect($created)
            ->map(fn (TutorAssignment $assignment): TutorAssignment => $this->loadTutorAssignmentRelations($assignment))
            ->values();

        $loadedAssignments->each(function (TutorAssignment $assignment): void {
            $assignment->tutor?->notify(new TutorAssignmentCreatedNotification($assignment));
            $assignment->student?->notify(new TutorAssignmentCreatedNotification($assignment));
        });

        if ($loadedAssignments->count() === 1) {
            /** @var TutorAssignment $assignment */
            $assignment = $loadedAssignments->first();
            $targetLabel = $this->tutorAssignmentTargetLabel($assignment);

            $this->auditLogService->log(
                request: $request,
                description: 'tutor_assignment.created',
                subject: $assignment,
                properties: [
                    'meta' => [
                        'action_label' => 'CREATE_TUTOR_ASSIGNMENT',
                        'target_label' => $targetLabel,
                        'description' => sprintf('Created %s.', $targetLabel),
                    ],
                ],
                event: 'created',
            );
        } else {
            $this->auditLogService->log(
                request: $request,
                description: 'tutor_assignment.bulk_created',
                properties: [
                    'meta' => [
                        'action_label' => 'BULK_CREATE_TUTOR_ASSIGNMENT',
                        'target_label' => 'Tutor Assignments',
                        'description' => sprintf(
                            'Created %d tutor assignments.',
                            $loadedAssignments->count(),
                        ),
                    ],
                ],
                event: 'created',
            );
        }

        return TutorAssignmentResource::collection(collect($created))
            ->response()
            ->setStatusCode(201);
    }

    #[Endpoint(title: 'Get Tutor Assignment')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'tutor_user_id' => 2,
        'student_user_id' => 5,
        'from_date' => '2026-03-01',
        'to_date' => '2026-03-30',
        'status' => 'ACTIVE',
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-01T00:00:00.000000Z',
    ]])]
    public function show(TutorAssignment $tutorAssignment): JsonResponse
    {
        return response()->json(new TutorAssignmentResource($tutorAssignment));
    }

    #[Endpoint(title: 'Export Tutor Assignments')]
    #[BodyParameter('tutor_assignment_ids', required: true, example: [1, 2, 3])]
    #[Response(status: 200, description: 'Excel file download')]
    public function export(ExportTutorAssignmentsRequest $request): StreamedResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $request->user();
        $validated = $request->validated();
        $tutorAssignmentIds = collect($validated['tutor_assignment_ids'])
            ->map(static fn (mixed $id): int => (int) $id)
            ->values()
            ->all();
        $tutorAssignmentIdPositions = array_flip($tutorAssignmentIds);

        $query = TutorAssignment::query()
            ->with([
                'tutor:id,name',
                'student:id,name',
            ])
            ->whereIn('id', $tutorAssignmentIds);

        if (
            $currentUser !== null
            && $currentUser->hasRole(Role::TUTOR)
            && ! $currentUser->hasAnyRole([Role::STAFF, Role::ADMIN])
        ) {
            $query->where('tutor_user_id', (int) $currentUser->id);
        }

        $tutorAssignments = $query
            ->get()
            ->sortBy(
                static fn (TutorAssignment $tutorAssignment): int => $tutorAssignmentIdPositions[$tutorAssignment->id] ?? PHP_INT_MAX
            )
            ->values();

        if ($tutorAssignments->count() !== count($tutorAssignmentIds)) {
            abort(403, 'Access denied for one or more tutor assignments.');
        }

        $spreadsheet = $this->tutorAssignmentExportService->createSpreadsheet($tutorAssignments);
        $writer = $this->tutorAssignmentExportService->createWriter($spreadsheet);
        $fileName = sprintf('%s.xlsx', Str::slug('allocations'));

        return response()->streamDownload(function () use ($writer, $spreadsheet): void {
            $writer->save('php://output');
            $spreadsheet->disconnectWorksheets();
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    #[Endpoint(title: 'Update Tutor Assignment')]
    #[BodyParameter('tutor_user_id', required: false, example: 2)]
    #[BodyParameter('student_user_id', required: false, example: 7)]
    #[BodyParameter('from_date', required: false, example: '2026-03-05')]
    #[BodyParameter('to_date', required: false, example: '2026-03-31')]
    #[BodyParameter('status', required: false, example: 'INACTIVE')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'tutor_user_id' => 2,
        'student_user_id' => 7,
        'from_date' => '2026-03-05',
        'to_date' => '2026-03-31',
        'status' => 'INACTIVE',
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-02T00:00:00.000000Z',
    ]])]
    public function update(UpdateTutorAssignmentRequest $request, TutorAssignment $tutorAssignment): JsonResponse
    {
        $validated = $request->validated();
        $before = $this->tutorAssignmentAuditAttributes($this->loadTutorAssignmentRelations($tutorAssignment));
        $previousStatus = $tutorAssignment->status;

        $payload = [];

        if (array_key_exists('tutor_user_id', $validated)) {
            $payload['tutor_user_id'] = (int) $validated['tutor_user_id'];
        }

        if (array_key_exists('student_user_id', $validated)) {
            $payload['student_user_id'] = (int) $validated['student_user_id'];
        }

        if (array_key_exists('from_date', $validated)) {
            $payload['start_date'] = $validated['from_date'];
        }

        if (array_key_exists('to_date', $validated)) {
            $payload['end_date'] = $validated['to_date'];
        }

        if (array_key_exists('status', $validated)) {
            $payload['status'] = $validated['status'];
        } elseif (array_key_exists('from_date', $validated) || array_key_exists('to_date', $validated)) {
            $payload['status'] = TutorAssignment::resolveStatusForDate(
                $validated['from_date'] ?? Carbon::parse($tutorAssignment->start_date),
                $validated['to_date'] ?? Carbon::parse($tutorAssignment->end_date),
            );
        }

        $tutorAssignment->update($payload);

        $freshAssignment = $tutorAssignment->fresh();

        if (
            $freshAssignment->status === TutorAssignment::STATUS_ACTIVE
            && in_array($previousStatus, [null, TutorAssignment::STATUS_INACTIVE], true)
        ) {
            $this->chatService->ensureAssignmentWelcomeConversation($freshAssignment);
        }

        $loadedAssignment = $this->loadTutorAssignmentRelations($freshAssignment);
        $changes = $this->auditLogService->diff($before, $this->tutorAssignmentAuditAttributes($loadedAssignment));

        if ($changes['old'] !== [] || $changes['attributes'] !== []) {
            $targetLabel = $this->tutorAssignmentTargetLabel($loadedAssignment);

            $this->auditLogService->log(
                request: $request,
                description: 'tutor_assignment.updated',
                subject: $loadedAssignment,
                properties: [
                    'old' => $changes['old'],
                    'attributes' => $changes['attributes'],
                    'meta' => [
                        'action_label' => 'UPDATE_TUTOR_ASSIGNMENT',
                        'target_label' => $targetLabel,
                        'description' => $this->tutorAssignmentUpdatedDescription($targetLabel, $changes),
                    ],
                ],
                event: 'updated',
            );
        }

        return response()->json(new TutorAssignmentResource($freshAssignment));
    }

    #[Endpoint(title: 'Delete Tutor Assignment')]
    #[Response(status: 204, examples: [[null]])]
    public function destroy(Request $request, TutorAssignment $tutorAssignment): JsonResponse
    {
        $loadedAssignment = $this->loadTutorAssignmentRelations($tutorAssignment);
        $targetLabel = $this->tutorAssignmentTargetLabel($loadedAssignment);
        $tutorAssignment->delete();

        $this->auditLogService->log(
            request: $request,
            description: 'tutor_assignment.deleted',
            subject: $tutorAssignment,
            properties: [
                'meta' => [
                    'action_label' => 'DELETE_TUTOR_ASSIGNMENT',
                    'target_label' => $targetLabel,
                    'description' => sprintf('Deleted %s.', $targetLabel),
                ],
            ],
            event: 'deleted',
        );

        return response()->json(null, 204);
    }

    #[Endpoint(title: 'Delete Multiple Tutor Assignments')]
    #[BodyParameter('tutor_assignment_ids', required: true, example: [1, 2, 3])]
    #[Response(status: 204, examples: [[null]])]
    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tutor_assignment_ids' => ['required', 'array', 'min:1'],
            'tutor_assignment_ids.*' => ['required', 'integer', 'distinct', 'exists:tutor_assignments,id'],
        ]);

        $assignments = TutorAssignment::query()
            ->with([
                'tutor:id,name',
                'student:id,name',
            ])
            ->whereIn('id', $validated['tutor_assignment_ids'])
            ->orderBy('id')
            ->get();

        $assignmentSnapshots = $assignments
            ->map(fn (TutorAssignment $assignment): array => $this->tutorAssignmentAuditAttributes($assignment))
            ->values()
            ->all();

        TutorAssignment::query()
            ->whereIn('id', $validated['tutor_assignment_ids'])
            ->delete();

        $this->auditLogService->log(
            request: $request,
            description: 'tutor_assignment.bulk_deleted',
            properties: [
                'meta' => [
                    'action_label' => 'BULK_DELETE_TUTOR_ASSIGNMENT',
                    'target_label' => 'Tutor Assignments',
                    'description' => sprintf(
                        'Deleted %d tutor assignments.',
                        count($assignmentSnapshots),
                    ),
                ],
            ],
            event: 'deleted',
        );

        return response()->json(null, 204);
    }

    private function loadTutorAssignmentRelations(TutorAssignment $tutorAssignment): TutorAssignment
    {
        return $tutorAssignment->loadMissing([
            'tutor:id,name',
            'student:id,name',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function tutorAssignmentAuditAttributes(TutorAssignment $tutorAssignment): array
    {
        $loadedAssignment = $this->loadTutorAssignmentRelations($tutorAssignment);

        return [
            'tutor_user_id' => $loadedAssignment->tutor_user_id,
            'student_user_id' => $loadedAssignment->student_user_id,
            'from_date' => $loadedAssignment->start_date,
            'to_date' => $loadedAssignment->end_date,
            'status' => $loadedAssignment->status,
        ];
    }

    private function tutorAssignmentTargetLabel(TutorAssignment $tutorAssignment): string
    {
        return sprintf('Tutor Assignment#%d', (int) $tutorAssignment->id);
    }

    /**
     * @param  array{old: array<string, mixed>, attributes: array<string, mixed>}  $changes
     */
    private function tutorAssignmentUpdatedDescription(string $targetLabel, array $changes): string
    {
        $fields = array_values(array_unique([
            ...array_keys($changes['old']),
            ...array_keys($changes['attributes']),
        ]));

        if ($fields === []) {
            return sprintf('Updated %s.', $targetLabel);
        }

        $labels = array_map(
            static fn (string $field): string => match ($field) {
                'tutor_user_id' => 'tutor',
                'student_user_id' => 'student',
                default => strtolower(str_replace('_', ' ', $field)),
            },
            $fields,
        );

        return sprintf('Updated %s: %s.', $targetLabel, implode(', ', $labels));
    }
}

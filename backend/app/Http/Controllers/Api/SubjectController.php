<?php

namespace App\Http\Controllers\Api;

use App\Traits\FormatsListingResponse;
use App\Http\Requests\Subject\StoreSubjectRequest;
use App\Http\Requests\Subject\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Models\Subject;
use App\Services\AuditLogService;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Subjects', description: 'Subject management endpoints.', weight: 3)]
class SubjectController
{
    use FormatsListingResponse;

    public function __construct(
        private readonly AuditLogService $auditLogService
    )
    {
    }

    #[Endpoint(title: 'List Subjects')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    #[Response(
        status: 200,
        examples: [[
            'data' => [[
                'id' => 1,
                'name' => 'Mathematics',
                'description' => 'Core mathematics topics and problem-solving.',
                'created_at' => '2026-02-05T00:00:00.000000Z',
                'updated_at' => '2026-02-05T00:00:00.000000Z',
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

        $subjects = Subject::query()
            ->latest('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $subjects->getCollection()
            ->map(fn (Subject $subject) => (new SubjectResource($subject))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($subjects, $data);
    }

    #[Endpoint(title: 'Create Subject')]
    #[BodyParameter('name', required: true, example: 'Mathematics')]
    #[BodyParameter('description', required: false, example: 'Core mathematics topics and problem-solving.')]
    #[Response(
        status: 201,
        examples: [[
            'id' => 1,
            'name' => 'Mathematics',
            'description' => 'Core mathematics topics and problem-solving.',
            'created_at' => '2026-02-05T00:00:00.000000Z',
            'updated_at' => '2026-02-05T00:00:00.000000Z',
        ]],
    )]
    public function store(StoreSubjectRequest $request): JsonResponse
    {
        $subject = Subject::create($request->validated());
        $targetLabel = $this->subjectTargetLabel($subject);

        $this->auditLogService->log(
            request: $request,
            description: 'subject.created',
            subject: $subject,
            properties: [
                'meta' => [
                    'action_label' => 'CREATE_SUBJECT',
                    'target_label' => $targetLabel,
                    'description' => sprintf('Created %s.', $targetLabel),
                ],
            ],
            event: 'created',
        );

        return response()->json(new SubjectResource($subject), 201);
    }

    #[Endpoint(title: 'Get Subject')]
    #[Response(
        status: 200,
        examples: [[
            'id' => 1,
            'name' => 'Mathematics',
            'description' => 'Core mathematics topics and problem-solving.',
            'created_at' => '2026-02-05T00:00:00.000000Z',
            'updated_at' => '2026-02-05T00:00:00.000000Z',
        ]],
    )]
    public function show(Subject $subject): JsonResponse
    {
        return response()->json(new SubjectResource($subject));
    }

    #[Endpoint(title: 'Update Subject')]
    #[BodyParameter('name', required: true, example: 'Advanced Mathematics')]
    #[BodyParameter('description', required: false, example: 'Advanced algebra, calculus, and discrete mathematics.')]
    #[Response(
        status: 200,
        examples: [[
            'id' => 1,
            'name' => 'Advanced Mathematics',
            'description' => 'Advanced algebra, calculus, and discrete mathematics.',
            'created_at' => '2026-02-05T00:00:00.000000Z',
            'updated_at' => '2026-02-06T00:00:00.000000Z',
        ]],
    )]
    public function update(UpdateSubjectRequest $request, Subject $subject): JsonResponse
    {
        $before = $this->subjectAuditAttributes($subject);
        $subject->update($request->validated());
        $freshSubject = $subject->fresh();
        $changes = $this->auditLogService->diff($before, $this->subjectAuditAttributes($freshSubject));

        if ($changes['old'] !== [] || $changes['attributes'] !== []) {
            $targetLabel = $this->subjectTargetLabel($freshSubject);

            $this->auditLogService->log(
                request: $request,
                description: 'subject.updated',
                subject: $freshSubject,
                properties: [
                    'old' => $changes['old'],
                    'attributes' => $changes['attributes'],
                    'meta' => [
                        'action_label' => 'UPDATE_SUBJECT',
                        'target_label' => $targetLabel,
                        'description' => $this->subjectUpdatedDescription($targetLabel, $changes),
                    ],
                ],
                event: 'updated',
            );
        }

        return response()->json(new SubjectResource($freshSubject));
    }

    #[Endpoint(title: 'Toggle Subject Status')]
    #[BodyParameter('is_active', required: true, example: true)]
    #[Response(
        status: 200,
        examples: [[
            'id' => 1,
            'name' => 'Mathematics',
            'description' => 'Core mathematics topics and problem-solving.',
            'is_active' => false,
            'created_at' => '2026-02-05T00:00:00.000000Z',
            'updated_at' => '2026-02-06T00:00:00.000000Z',
        ]],
    )]
    public function toggleStatus(Request $request, Subject $subject): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $before = $this->subjectAuditAttributes($subject);
        $subject->update(['is_active' => $validated['is_active']]);
        $freshSubject = $subject->fresh();
        $targetLabel = $this->subjectTargetLabel($freshSubject);

        $this->auditLogService->log(
            request: $request,
            description: 'subject.status_updated',
            subject: $freshSubject,
            properties: [
                'old' => [
                    'is_active' => $before['is_active'],
                ],
                'attributes' => [
                    'is_active' => $freshSubject->is_active,
                ],
                'meta' => [
                    'action_label' => 'UPDATE_SUBJECT_STATUS',
                    'target_label' => $targetLabel,
                    'description' => sprintf(
                        'Updated %s status to %s.',
                        $targetLabel,
                        $freshSubject->is_active ? 'active' : 'inactive',
                    ),
                ],
            ],
            event: 'updated',
        );

        return response()->json(new SubjectResource($freshSubject));
    }

    #[Endpoint(title: 'Delete Subject')]
    #[Response(status: 204, examples: [[null]])]
    public function destroy(Request $request, Subject $subject): JsonResponse
    {
        $targetLabel = $this->subjectTargetLabel($subject);
        $subject->delete();

        $this->auditLogService->log(
            request: $request,
            description: 'subject.deleted',
            subject: $subject,
            properties: [
                'meta' => [
                    'action_label' => 'DELETE_SUBJECT',
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
    private function subjectAuditAttributes(Subject $subject): array
    {
        return [
            'id' => $subject->id,
            'name' => $subject->name,
            'description' => $subject->description,
            'is_active' => $subject->is_active,
        ];
    }

    private function subjectTargetLabel(Subject $subject): string
    {
        return sprintf('Subject#%d', (int) $subject->id);
    }

    /**
     * @param  array{old: array<string, mixed>, attributes: array<string, mixed>}  $changes
     */
    private function subjectUpdatedDescription(string $targetLabel, array $changes): string
    {
        $fields = array_values(array_unique([
            ...array_keys($changes['old']),
            ...array_keys($changes['attributes']),
        ]));

        if ($fields === []) {
            return sprintf('Updated %s.', $targetLabel);
        }

        $labels = array_map(
            static fn (string $field): string => $field === 'is_active'
                ? 'status'
                : strtolower(str_replace('_', ' ', $field)),
            $fields,
        );

        return sprintf('Updated %s: %s.', $targetLabel, implode(', ', $labels));
    }
}

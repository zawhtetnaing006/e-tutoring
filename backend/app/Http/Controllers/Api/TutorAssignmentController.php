<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\TutorAssignment\StoreTutorAssignmentRequest;
use App\Http\Requests\TutorAssignment\UpdateTutorAssignmentRequest;
use App\Http\Resources\TutorAssignmentResource;
use App\Models\TutorAssignment;
use App\Models\Role;
use App\Models\User;
use App\Traits\FormatsListingResponse;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

#[Group('Tutor Assignments', description: 'Tutor assignment management endpoints.', weight: 6)]
class TutorAssignmentController
{
    use FormatsListingResponse;

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
    #[Response(status: 201, examples: [[
        [
            'id' => 1,
            'tutor_user_id' => 2,
            'student_user_id' => 5,
            'from_date' => '2026-03-01',
            'to_date' => '2026-03-30',
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ],
        [
            'id' => 2,
            'tutor_user_id' => 2,
            'student_user_id' => 9,
            'from_date' => '2026-03-01',
            'to_date' => '2026-03-30',
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

        $created = DB::transaction(function () use ($tutorUserId, $studentUserIds, $fromDate, $toDate): array {
            $records = [];

            foreach ($studentUserIds as $studentUserId) {
                $records[] = TutorAssignment::query()->create([
                    'tutor_user_id' => $tutorUserId,
                    'student_user_id' => (int) $studentUserId,
                    'start_date' => $fromDate,
                    'end_date' => $toDate,
                ]);
            }

            return $records;
        });

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
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-01T00:00:00.000000Z',
    ]])]
    public function show(TutorAssignment $tutorAssignment): JsonResponse
    {
        return response()->json(new TutorAssignmentResource($tutorAssignment));
    }

    #[Endpoint(title: 'Update Tutor Assignment')]
    #[BodyParameter('tutor_user_id', required: false, example: 2)]
    #[BodyParameter('student_user_id', required: false, example: 7)]
    #[BodyParameter('from_date', required: false, example: '2026-03-05')]
    #[BodyParameter('to_date', required: false, example: '2026-03-31')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'tutor_user_id' => 2,
        'student_user_id' => 7,
        'from_date' => '2026-03-05',
        'to_date' => '2026-03-31',
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-02T00:00:00.000000Z',
    ]])]
    public function update(UpdateTutorAssignmentRequest $request, TutorAssignment $tutorAssignment): JsonResponse
    {
        $validated = $request->validated();

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

        $tutorAssignment->update($payload);

        return response()->json(new TutorAssignmentResource($tutorAssignment->fresh()));
    }

    #[Endpoint(title: 'Delete Tutor Assignment')]
    #[Response(status: 204, examples: [[null]])]
    public function destroy(TutorAssignment $tutorAssignment): JsonResponse
    {
        $tutorAssignment->delete();

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

        TutorAssignment::query()
            ->whereIn('id', $validated['tutor_assignment_ids'])
            ->delete();

        return response()->json(null, 204);
    }
}

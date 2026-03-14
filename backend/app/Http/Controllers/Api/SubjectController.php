<?php

namespace App\Http\Controllers\Api;

use App\Traits\FormatsListingResponse;
use App\Http\Requests\Subject\StoreSubjectRequest;
use App\Http\Requests\Subject\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Models\Subject;
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
        $subject->update($request->validated());

        return response()->json(new SubjectResource($subject->fresh()));
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

        $subject->update(['is_active' => $validated['is_active']]);

        return response()->json(new SubjectResource($subject->fresh()));
    }

    #[Endpoint(title: 'Delete Subject')]
    #[Response(status: 204, examples: [[null]])]
    public function destroy(Subject $subject): JsonResponse
    {
        $subject->delete();

        return response()->json(null, 204);
    }
}

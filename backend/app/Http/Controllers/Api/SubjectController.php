<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Subject\StoreSubjectRequest;
use App\Http\Requests\Subject\UpdateSubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Models\Subject;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Subjects', description: 'Subject management endpoints.', weight: 3)]
class SubjectController
{
    #[Endpoint(title: 'List Subjects')]
    #[Response(
        status: 200,
        examples: [[
            'data' => [[
                'id' => 1,
                'name' => 'Mathematics',
                'created_at' => '2026-02-05T00:00:00.000000Z',
                'updated_at' => '2026-02-05T00:00:00.000000Z',
            ]],
        ]],
    )]
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));

        $subjects = Subject::query()
            ->latest('id')
            ->paginate($perPage);

        return SubjectResource::collection($subjects)->response();
    }

    #[Endpoint(title: 'Create Subject')]
    #[BodyParameter('name', required: true, example: 'Mathematics')]
    #[Response(
        status: 201,
        examples: [[
            'id' => 1,
            'name' => 'Mathematics',
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
    #[Response(
        status: 200,
        examples: [[
            'id' => 1,
            'name' => 'Advanced Mathematics',
            'created_at' => '2026-02-05T00:00:00.000000Z',
            'updated_at' => '2026-02-06T00:00:00.000000Z',
        ]],
    )]
    public function update(UpdateSubjectRequest $request, Subject $subject): JsonResponse
    {
        $subject->update($request->validated());

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

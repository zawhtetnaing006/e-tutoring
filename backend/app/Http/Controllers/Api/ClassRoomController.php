<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\ClassRoom\StoreClassRoomRequest;
use App\Http\Requests\ClassRoom\UpdateClassRoomRequest;
use App\Http\Resources\ClassRoomResource;
use App\Models\ClassRoom;
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

#[Group('Class Rooms', description: 'Class room management endpoints.', weight: 6)]
class ClassRoomController
{
    use FormatsListingResponse;

    #[Endpoint(title: 'List Class Rooms')]
    #[QueryParameter('only_mine', required: false, example: true)]
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
        ]);

        /** @var User|null $currentUser */
        $currentUser = $request->user();

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $page = max(1, (int) $request->integer('page', 1));
        $onlyMine = (bool) ($data['only_mine'] ?? false);

        $query = ClassRoom::query();

        if ($onlyMine && $currentUser !== null) {
            $userType = strtoupper((string) $currentUser->user_type);

            if ($userType === User::TYPE_TUTOR) {
                $query->where('tutor_user_id', (int) $currentUser->id);
            } elseif ($userType === User::TYPE_STUDENT) {
                $query->where('student_user_id', (int) $currentUser->id);
            }
        }

        $classRooms = $query
            ->latest('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $classRooms->getCollection()
            ->map(fn (ClassRoom $classRoom) => (new ClassRoomResource($classRoom))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($classRooms, $data);
    }

    #[Endpoint(title: 'Create Class Rooms')]
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
    public function store(StoreClassRoomRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $tutorUserId = (int) $validated['tutor_user_id'];
        $studentUserIds = $validated['student_user_ids'];
        $fromDate = (string) $validated['from_date'];
        $toDate = (string) $validated['to_date'];

        $created = DB::transaction(function () use ($tutorUserId, $studentUserIds, $fromDate, $toDate): array {
            $records = [];

            foreach ($studentUserIds as $studentUserId) {
                $records[] = ClassRoom::query()->create([
                    'tutor_user_id' => $tutorUserId,
                    'student_user_id' => (int) $studentUserId,
                    'start_date' => $fromDate,
                    'end_date' => $toDate,
                ]);
            }

            return $records;
        });

        return ClassRoomResource::collection(collect($created))
            ->response()
            ->setStatusCode(201);
    }

    #[Endpoint(title: 'Get Class Room')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'tutor_user_id' => 2,
        'student_user_id' => 5,
        'from_date' => '2026-03-01',
        'to_date' => '2026-03-30',
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-01T00:00:00.000000Z',
    ]])]
    public function show(ClassRoom $classRoom): JsonResponse
    {
        return response()->json(new ClassRoomResource($classRoom));
    }

    #[Endpoint(title: 'Update Class Room')]
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
    public function update(UpdateClassRoomRequest $request, ClassRoom $classRoom): JsonResponse
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

        $classRoom->update($payload);

        return response()->json(new ClassRoomResource($classRoom->fresh()));
    }

    #[Endpoint(title: 'Delete Class Room')]
    #[Response(status: 204, examples: [[null]])]
    public function destroy(ClassRoom $classRoom): JsonResponse
    {
        $classRoom->delete();

        return response()->json(null, 204);
    }
}

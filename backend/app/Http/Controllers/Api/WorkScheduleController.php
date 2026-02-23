<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\WorkSchedule\StoreWorkScheduleRequest;
use App\Http\Requests\WorkSchedule\UpdateWorkScheduleRequest;
use App\Http\Resources\WorkScheduleResource;
use App\Models\User;
use App\Models\WorkSchedule;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

#[Group('Work Schedules', description: 'User work schedule management.', weight: 5)]
class WorkScheduleController
{
    #[Endpoint(title: 'List User Work Schedules')]
    #[Response(status: 200, examples: [[
        'data' => [[
            'id' => 1,
            'user_id' => 10,
            'day_of_week' => 'MONDAY',
            'from_time' => '09:00:00',
            'to_time' => '17:00:00',
            'created_at' => '2026-02-23T11:00:00.000000Z',
            'updated_at' => '2026-02-23T11:00:00.000000Z',
        ]],
    ]])]
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'string', 'max:64'],
        ]);

        $user = $this->resolveUserFromIdentifier((string) $data['user_id']);

        $this->ensureCanViewUserSchedule($request, $user);

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));

        $schedules = $user->workSchedules()
            ->orderBy('day_of_week')
            ->orderBy('from_time')
            ->paginate($perPage);

        return WorkScheduleResource::collection($schedules)->response();
    }

    #[Endpoint(title: 'Create User Work Schedule')]
    #[BodyParameter('user_id', required: true, example: 'b0c1d2e3-4f5a-6789-aaaa-bbbbbbbbbbbb')]
    #[BodyParameter('schedules', required: true, example: [
        ['day_of_week' => 'MONDAY', 'from_time' => '09:00', 'to_time' => '17:00'],
        ['day_of_week' => 'TUESDAY', 'from_time' => '09:00', 'to_time' => '17:00'],
    ])]
    #[Response(status: 201, examples: [[
        'data' => [[
            'id' => 1,
            'user_id' => 10,
            'day_of_week' => 'MONDAY',
            'from_time' => '09:00:00',
            'to_time' => '17:00:00',
            'created_at' => '2026-02-23T11:00:00.000000Z',
            'updated_at' => '2026-02-23T11:00:00.000000Z',
        ]],
    ]])]
    public function store(StoreWorkScheduleRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $this->resolveUserFromIdentifier((string) $validated['user_id']);

        $this->ensureCanManageUserSchedule($request, $user);

        $schedules = $validated['schedules'] ?? [];

        $created = DB::transaction(function () use ($user, $schedules): array {
            $createdSchedules = [];

            foreach ($schedules as $schedule) {
                $createdSchedules[] = $user->workSchedules()->create($schedule);
            }

            return $createdSchedules;
        });

        return WorkScheduleResource::collection(collect($created))
            ->response()
            ->setStatusCode(201);
    }

    #[Endpoint(title: 'Get User Work Schedule')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'user_id' => 10,
        'day_of_week' => 'MONDAY',
        'from_time' => '09:00:00',
        'to_time' => '17:00:00',
        'created_at' => '2026-02-23T11:00:00.000000Z',
        'updated_at' => '2026-02-23T11:00:00.000000Z',
    ]])]
    public function show(Request $request, WorkSchedule $workSchedule): JsonResponse
    {
        $this->ensureCanViewUserSchedule($request, $workSchedule->user);

        return response()->json(new WorkScheduleResource($workSchedule));
    }

    #[Endpoint(title: 'Update User Work Schedule')]
    #[BodyParameter('day_of_week', required: false, example: 'TUESDAY')]
    #[BodyParameter('from_time', required: false, example: '10:00')]
    #[BodyParameter('to_time', required: false, example: '18:00')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'user_id' => 10,
        'day_of_week' => 'TUESDAY',
        'from_time' => '10:00:00',
        'to_time' => '18:00:00',
        'created_at' => '2026-02-23T11:00:00.000000Z',
        'updated_at' => '2026-02-23T12:00:00.000000Z',
    ]])]
    public function update(UpdateWorkScheduleRequest $request, WorkSchedule $workSchedule): JsonResponse
    {
        $this->ensureCanManageUserSchedule($request, $workSchedule->user);

        $workSchedule->update($request->validated());

        return response()->json(new WorkScheduleResource($workSchedule->fresh()));
    }

    #[Endpoint(title: 'Delete User Work Schedule')]
    #[Response(status: 204, examples: [[null]])]
    public function destroy(Request $request, WorkSchedule $workSchedule): JsonResponse
    {
        $this->ensureCanManageUserSchedule($request, $workSchedule->user);

        $workSchedule->delete();

        return response()->json(null, 204);
    }

    private function ensureCanViewUserSchedule(Request $request, User $user): void
    {
        $currentUser = $request->user();

        if ($currentUser === null) {
            abort(401, 'Unauthenticated.');
        }

        $currentUserType = strtoupper((string) $currentUser->user_type);

        if ($currentUserType === User::TYPE_STAFF || $currentUserType === User::TYPE_STUDENT) {
            return;
        }

        if ($currentUserType === User::TYPE_TUTOR && (int) $currentUser->id === (int) $user->id) {
            return;
        }

        abort(403, 'You are not allowed to access this work schedule.');
    }

    private function ensureCanManageUserSchedule(Request $request, User $user): void
    {
        $currentUser = $request->user();

        if ($currentUser === null) {
            abort(401, 'Unauthenticated.');
        }

        $currentUserType = strtoupper((string) $currentUser->user_type);

        if ($currentUserType === User::TYPE_STAFF) {
            return;
        }

        if ($currentUserType === User::TYPE_TUTOR && (int) $currentUser->id === (int) $user->id) {
            return;
        }

        abort(403, 'You are not allowed to modify this work schedule.');
    }

    private function resolveUserFromIdentifier(string $identifier): User
    {
        $user = (new User())->resolveRouteBinding($identifier);
        abort_if($user === null, 404, 'Resource not found.');

        return $user;
    }
}

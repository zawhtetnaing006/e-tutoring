<?php

namespace App\Http\Controllers\Api;

use App\Traits\FormatsListingResponse;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Notifications\UserGeneratedPasswordNotification;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

#[Group('Users', description: 'User management endpoints.', weight: 2)]
class UserController
{
    use FormatsListingResponse;

    #[Endpoint(title: 'List Users')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    #[Response(
        status: 200,
        examples: [[
            'data' => [[
                'uuid' => '5f5c6a23-6a5f-4c9f-9c6f-1e3d2a2c7b2e',
                'name' => 'Admin User',
                'email' => 'admin@gmail.com',
                'phone' => null,
                'address' => null,
                'country' => null,
                'city' => null,
                'township' => null,
                'is_active' => true,
                'user_type' => 'STAFF',
                'subjects' => [['id' => 1, 'name' => 'Mathematics']],
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

        $users = User::query()
            ->with('subjects:id,name')
            ->latest('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $users->getCollection()
            ->map(fn (User $user) => (new UserResource($user))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($users, $data);
    }

    #[Endpoint(title: 'Create User')]
    #[BodyParameter('name', required: true, example: 'Jane Doe')]
    #[BodyParameter('email', required: true, example: 'jane@example.com')]
    #[BodyParameter('auto_generate_password', required: false, example: true)]
    #[BodyParameter('password', required: false, example: 'secret123')]
    #[BodyParameter('phone', required: false, example: '+1-555-1234')]
    #[BodyParameter('address', required: false, example: '123 Main St')]
    #[BodyParameter('country', required: false, example: 'USA')]
    #[BodyParameter('city', required: false, example: 'New York')]
    #[BodyParameter('township', required: false, example: 'Manhattan')]
    #[BodyParameter('is_active', required: false, example: true)]
    #[BodyParameter('user_type', required: true, example: 'STUDENT')]
    #[BodyParameter('subject_ids', required: false, example: [1, 2])]
    #[Response(
        status: 201,
        examples: [[
            'uuid' => 'b0c1d2e3-4f5a-6789-aaaa-bbbbbbbbbbbb',
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'phone' => '+1-555-1234',
            'address' => '123 Main St',
            'country' => 'USA',
            'city' => 'New York',
            'township' => 'Manhattan',
            'is_active' => true,
            'user_type' => 'STUDENT',
            'subjects' => [['id' => 1, 'name' => 'Mathematics']],
            'created_at' => '2026-02-05T00:00:00.000000Z',
            'updated_at' => '2026-02-05T00:00:00.000000Z',
        ]],
    )]
    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $subjectIds = $validated['subject_ids'] ?? [];
        $autoGeneratePassword = (bool) ($validated['auto_generate_password'] ?? false);
        $plainPassword = $autoGeneratePassword
            ? Str::random(12)
            : (string) ($validated['password'] ?? '');

        unset($validated['subject_ids'], $validated['auto_generate_password']);

        $validated['password'] = Hash::make($plainPassword);
        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        $user = User::create($validated);
        $user->subjects()->sync($subjectIds);

        if ($autoGeneratePassword) {
            $user->notify(new UserGeneratedPasswordNotification($plainPassword));
        }

        return response()->json(new UserResource($user->load('subjects:id,name')), 201);
    }

    #[Endpoint(title: 'Get User')]
    #[Response(
        status: 200,
        examples: [[
            'uuid' => '5f5c6a23-6a5f-4c9f-9c6f-1e3d2a2c7b2e',
            'name' => 'Admin User',
            'email' => 'admin@gmail.com',
            'phone' => null,
            'address' => null,
            'country' => null,
            'city' => null,
            'township' => null,
            'is_active' => true,
            'user_type' => 'STAFF',
            'subjects' => [['id' => 1, 'name' => 'Mathematics']],
            'created_at' => '2026-02-05T00:00:00.000000Z',
            'updated_at' => '2026-02-05T00:00:00.000000Z',
        ]],
    )]
    public function show(User $user): JsonResponse
    {
        return response()->json(new UserResource($user->load('subjects:id,name')));
    }

    #[Endpoint(title: 'Update User')]
    #[BodyParameter('name', required: false, example: 'Jane Updated')]
    #[BodyParameter('email', required: false, example: 'jane.updated@example.com')]
    #[BodyParameter('password', required: false, example: 'new-secret-123')]
    #[BodyParameter('password_confirmation', required: false, example: 'new-secret-123')]
    #[BodyParameter('phone', required: false, example: '+1-555-0000')]
    #[BodyParameter('address', required: false, example: '456 Oak St')]
    #[BodyParameter('country', required: false, example: 'USA')]
    #[BodyParameter('city', required: false, example: 'San Francisco')]
    #[BodyParameter('township', required: false, example: 'SOMA')]
    #[BodyParameter('is_active', required: false, example: true)]
    #[BodyParameter('subject_ids', required: false, example: [1, 3])]
    #[Response(
        status: 200,
        examples: [[
            'uuid' => '5f5c6a23-6a5f-4c9f-9c6f-1e3d2a2c7b2e',
            'name' => 'Jane Updated',
            'email' => 'jane.updated@example.com',
            'phone' => '+1-555-0000',
            'address' => '456 Oak St',
            'country' => 'USA',
            'city' => 'San Francisco',
            'township' => 'SOMA',
            'is_active' => true,
            'user_type' => 'STUDENT',
            'subjects' => [['id' => 1, 'name' => 'Mathematics']],
            'created_at' => '2026-02-05T00:00:00.000000Z',
            'updated_at' => '2026-02-06T00:00:00.000000Z',
        ]],
    )]
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();
        $hasSubjectIds = array_key_exists('subject_ids', $validated);
        $subjectIds = $validated['subject_ids'] ?? [];

        unset($validated['subject_ids']);

        if (array_key_exists('password', $validated)) {
            $validated['password'] = Hash::make((string) $validated['password']);
        }

        $user->update($validated);

        if ($hasSubjectIds) {
            $user->subjects()->sync($subjectIds);
        }

        return response()->json(new UserResource($user->fresh()->load('subjects:id,name')));
    }

    #[Endpoint(title: 'Delete User')]
    #[Response(status: 204, examples: [[null]])]
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(null, 204);
    }
}

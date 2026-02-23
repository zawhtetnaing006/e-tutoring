<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController
{
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));

        $users = User::query()
            ->latest('id')
            ->paginate($perPage);

        return UserResource::collection($users)->response();
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $validated['password'] = Hash::make((string) $validated['password']);
        $validated['is_active'] = (bool) ($validated['is_active'] ?? true);

        $user = User::create($validated);

        return response()->json(new UserResource($user), 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(new UserResource($user));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();

        if (array_key_exists('password', $validated)) {
            $validated['password'] = Hash::make((string) $validated['password']);
        }

        $user->update($validated);

        return response()->json(new UserResource($user->fresh()));
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->noContent();
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Auth', description: 'Authentication endpoints.', weight: 1)]
class AuthController
{
    public function __construct(
        private readonly AuthService $authService
    )
    {
    }

    #[Endpoint(title: 'Login')]
    #[BodyParameter('email', required: true, example: 'admin@gmail.com')]
    #[BodyParameter('password', required: true, example: 'password')]
    #[Response(
        status: 200,
        examples: [
            [
                'token' => '1|example_token_value',
                'token_type' => 'Bearer',
                'user' => [
                    'uuid' => '5f5c6a23-6a5f-4c9f-9c6f-1e3d2a2c7b2e',
                    'name' => 'Admin User',
                    'email' => 'admin@gmail.com',
                    'phone' => null,
                    'address' => null,
                    'created_at' => '2026-02-05T00:00:00.000000Z',
                    'updated_at' => '2026-02-05T00:00:00.000000Z',
                ],
            ],
        ],
    )]
    #[Response(
        status: 422,
        examples: [
            [
                'message' => 'Invalid credentials.',
            ],
        ],
    )]
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $payload = $this->authService->login($validated, $request->userAgent());

        if ($payload === null) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 422);
        }

        return response()->json($payload);
    }

    #[Endpoint(title: 'Register')]
    #[BodyParameter('name', required: true, example: 'Jane Doe')]
    #[BodyParameter('email', required: true, example: 'jane@example.com')]
    #[BodyParameter('password', required: true, example: 'secret123')]
    #[BodyParameter('password_confirmation', required: true, example: 'secret123')]
    #[Response(
        status: 201,
        examples: [
            [
                'token' => '1|example_token_value',
                'token_type' => 'Bearer',
                'user' => [
                    'uuid' => 'b0c1d2e3-4f5a-6789-aaaa-bbbbbbbbbbbb',
                    'name' => 'Jane Doe',
                    'email' => 'jane@example.com',
                    'phone' => null,
                    'address' => null,
                    'created_at' => '2026-02-05T00:00:00.000000Z',
                    'updated_at' => '2026-02-05T00:00:00.000000Z',
                ],
            ],
        ],
    )]
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $payload = $this->authService->register($validated, $request->userAgent());

        return response()->json($payload, 201);
    }

    #[Endpoint(title: 'Current User')]
    #[Response(
        status: 200,
        examples: [
            [
                'uuid' => '5f5c6a23-6a5f-4c9f-9c6f-1e3d2a2c7b2e',
                'name' => 'Admin User',
                'email' => 'admin@gmail.com',
                'phone' => null,
                'address' => null,
                'created_at' => '2026-02-05T00:00:00.000000Z',
                'updated_at' => '2026-02-05T00:00:00.000000Z',
            ],
        ],
    )]
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json($user ? new UserResource($user) : null);
    }

    #[Endpoint(title: 'Logout')]
    #[Response(
        status: 200,
        examples: [
            [
                'message' => 'Logged out.',
            ],
        ],
    )]
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'message' => 'Logged out.',
        ]);
    }
}

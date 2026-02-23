<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyResetCodeRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

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
                    'user_type' => 'STAFF',
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
    /** @unauthenticated */
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
                'user_type' => 'STAFF',
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

    #[Endpoint(title: 'Forgot Password')]
    #[BodyParameter('email', required: true, example: 'jane@example.com')]
    #[Response(
        status: 200,
        examples: [
            [
                'message' => 'If the email exists, a reset OTP has been sent.',
            ],
        ],
    )]
    #[Response(
        status: 429,
        examples: [
            [
                'message' => 'Please wait before retrying.',
            ],
        ],
    )]
    /** @unauthenticated */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = $this->authService->sendPasswordResetCode($request->validated('email'));

        if ($status === Password::RESET_THROTTLED) {
            return response()->json([
                'message' => __($status),
            ], 429);
        }

        return response()->json([
            'message' => __($status),
        ]);
    }

    #[Endpoint(title: 'Verify Reset Code')]
    #[BodyParameter('otp', required: true, example: '123456')]
    #[BodyParameter('email', required: true, example: 'jane@example.com')]
    #[Response(
        status: 200,
        examples: [
            [
                'message' => 'Reset OTP is valid.',
            ],
        ],
    )]
    #[Response(
        status: 422,
        examples: [
            [
                'message' => 'The provided OTP is invalid or expired.',
            ],
        ],
    )]
    /** @unauthenticated */
    public function verifyResetCode(VerifyResetCodeRequest $request): JsonResponse
    {
        $status = $this->authService->verifyPasswordResetCode($request->validated());

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => __($status),
            ], 422);
        }

        return response()->json([
            'message' => __('auth.reset_otp_valid'),
        ]);
    }

    #[Endpoint(title: 'Reset Password')]
    #[BodyParameter('otp', required: true, example: '123456')]
    #[BodyParameter('email', required: true, example: 'jane@example.com')]
    #[BodyParameter('password', required: true, example: 'new-secret-123')]
    #[BodyParameter('password_confirmation', required: true, example: 'new-secret-123')]
    #[Response(
        status: 200,
        examples: [
            [
                'message' => 'Password reset successful.',
            ],
        ],
    )]
    #[Response(
        status: 422,
        examples: [
            [
                'message' => 'The provided OTP is invalid or expired.',
            ],
        ],
    )]
    /** @unauthenticated */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = $this->authService->resetPassword($request->validated());

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => __($status),
            ], 422);
        }

        return response()->json([
            'message' => __($status),
        ]);
    }
}

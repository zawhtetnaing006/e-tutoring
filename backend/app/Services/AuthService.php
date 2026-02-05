<?php

namespace App\Services;

use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    /**
     * @param array{email:string,password:string} $credentials
     * @return array{token:string,token_type:string,user:UserResource}|null
     */
    public function login(array $credentials, ?string $tokenName = null): ?array
    {
        $user = User::firstWhere('email', $credentials['email']);

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return null;
        }

        $token = $user->createToken($tokenName ?? 'api')->plainTextToken;

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ];
    }

    /**
     * @param array{name:string,email:string,password:string} $data
     * @return array{token:string,token_type:string,user:UserResource}
     */
    public function register(array $data, ?string $tokenName = null): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken($tokenName ?? 'api')->plainTextToken;

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ];
    }

    public function logout(?User $user): void
    {
        if ($user === null) {
            return;
        }

        /** @var PersonalAccessToken|null $token */
        $token = $user->currentAccessToken();
        if ($token !== null) {
            $token->delete();
        }
    }
}

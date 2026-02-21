<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\PasswordResetCodeNotification;
use App\Http\Resources\UserResource;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
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

    /**
     * @param array{email:string,password:string} $credentials
     * @return array{token:string,token_type:string,user:UserResource}|null
     */
    public function login(array $credentials, ?string $tokenName = null): ?array
    {
        $user = User::firstWhere('email', $credentials['email']);

        if (! $user || ! $user->is_active || ! Hash::check($credentials['password'], $user->password)) {
            return null;
        }

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

    public function sendPasswordResetCode(string $email): string
    {
        $user = User::where('email', $email)
            ->where('is_active', true)
            ->first();

        if ($user === null) {
            return Password::RESET_LINK_SENT;
        }

        $table = $this->passwordResetTable();
        $tokenRecord = DB::table($table)->where('email', $user->email)->first();
        $throttleSeconds = $this->passwordResetThrottleSeconds();

        if ($tokenRecord !== null && $tokenRecord->created_at !== null && $throttleSeconds > 0) {
            $createdAt = Carbon::parse($tokenRecord->created_at);
            if ($createdAt->diffInSeconds(now()) < $throttleSeconds) {
                return Password::RESET_THROTTLED;
            }
        }

        $code = (string) random_int(100000, 999999);

        DB::table($table)->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($code),
                'created_at' => now(),
            ]
        );

        $user->notify(new PasswordResetCodeNotification($code, $this->passwordResetExpireMinutes()));

        return Password::RESET_LINK_SENT;
    }

    /**
     * @param array{otp:string,email:string} $data
     */
    public function verifyPasswordResetCode(array $data): string
    {
        $user = User::where('email', $data['email'])
            ->where('is_active', true)
            ->first();

        if ($user === null) {
            return Password::INVALID_TOKEN;
        }

        $table = $this->passwordResetTable();
        $tokenRecord = DB::table($table)->where('email', $data['email'])->first();

        if ($tokenRecord === null || $tokenRecord->created_at === null) {
            return Password::INVALID_TOKEN;
        }

        $createdAt = Carbon::parse($tokenRecord->created_at);
        if ($createdAt->addMinutes($this->passwordResetExpireMinutes())->isPast()) {
            DB::table($table)->where('email', $data['email'])->delete();

            return Password::INVALID_TOKEN;
        }

        if (! Hash::check($data['otp'], (string) $tokenRecord->token)) {
            return Password::INVALID_TOKEN;
        }

        return Password::PASSWORD_RESET;
    }

    /**
     * @param array{otp:string,email:string,password:string,password_confirmation:string} $data
     */
    public function resetPassword(array $data): string
    {
        if ($this->verifyPasswordResetCode([
            'email' => $data['email'],
            'otp' => $data['otp'],
        ]) !== Password::PASSWORD_RESET) {
            return Password::INVALID_TOKEN;
        }

        $user = User::where('email', $data['email'])
            ->where('is_active', true)
            ->first();

        if ($user === null) {
            return Password::INVALID_TOKEN;
        }

        $table = $this->passwordResetTable();

        $user->forceFill([
            'password' => $data['password'],
            'remember_token' => Str::random(60),
        ])->save();

        $user->tokens()->delete();
        DB::table($table)->where('email', $data['email'])->delete();

        event(new PasswordReset($user));

        return Password::PASSWORD_RESET;
    }

    private function passwordResetTable(): string
    {
        $broker = (string) config('auth.defaults.passwords', 'users');
        $table = config("auth.passwords.{$broker}.table", 'password_reset_tokens');

        return (string) $table;
    }

    private function passwordResetExpireMinutes(): int
    {
        $broker = (string) config('auth.defaults.passwords', 'users');
        $expire = (int) config("auth.passwords.{$broker}.expire", 60);

        return $expire > 0 ? $expire : 60;
    }

    private function passwordResetThrottleSeconds(): int
    {
        $broker = (string) config('auth.defaults.passwords', 'users');
        $throttle = (int) config("auth.passwords.{$broker}.throttle", 60);

        return $throttle > 0 ? $throttle : 0;
    }
}

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
    private const LOGIN_MAX_ATTEMPTS = 3;
    private const LOGIN_LOCKOUT_MINUTES = 15;

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
     * @return array{status:'success',token:string,token_type:string,user:UserResource}|array{status:'locked',available_in:int}|array{status:'invalid_credentials'}
     */
    public function login(array $credentials, ?string $tokenName = null): array
    {
        $email = $this->normalizeEmail($credentials['email']);
        $user = User::firstWhere('email', $email);

        if (! $user || ! $user->is_active) {
            return [
                'status' => 'invalid_credentials',
            ];
        }

        $this->clearExpiredLoginLock($user);

        if ($this->isLoginLocked($user)) {
            return [
                'status' => 'locked',
                'available_in' => $this->lockAvailableIn($user),
            ];
        }

        if (! Hash::check($credentials['password'], $user->password)) {
            return $this->recordFailedLoginAttempt($user);
        }

        $this->resetLoginLockState($user);

        $token = $user->createToken($tokenName ?? 'api')->plainTextToken;

        return [
            'status' => 'success',
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

    /**
     * @return array{status:'locked',available_in:int}|array{status:'invalid_credentials'}
     */
    private function recordFailedLoginAttempt(User $user): array
    {
        $attempts = max(0, (int) $user->failed_login_attempts) + 1;

        if ($attempts >= self::LOGIN_MAX_ATTEMPTS) {
            $lockedAt = now();
            $lockedUntil = $lockedAt->copy()->addMinutes(self::LOGIN_LOCKOUT_MINUTES);

            $user->forceFill([
                'failed_login_attempts' => $attempts,
                'locked_until' => $lockedUntil,
            ])->save();

            $user->failed_login_attempts = $attempts;
            $user->locked_until = $lockedUntil;

            return [
                'status' => 'locked',
                'available_in' => $lockedAt->diffInSeconds($lockedUntil),
            ];
        }

        $user->forceFill([
            'failed_login_attempts' => $attempts,
        ])->save();

        $user->failed_login_attempts = $attempts;

        return [
            'status' => 'invalid_credentials',
        ];
    }

    private function clearExpiredLoginLock(User $user): void
    {
        if ($user->locked_until instanceof Carbon && ! $user->locked_until->isFuture()) {
            $this->resetLoginLockState($user);
        }
    }

    private function resetLoginLockState(User $user): void
    {
        if ((int) $user->failed_login_attempts === 0 && $user->locked_until === null) {
            return;
        }

        $user->forceFill([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ])->save();

        $user->failed_login_attempts = 0;
        $user->locked_until = null;
    }

    private function isLoginLocked(User $user): bool
    {
        return $user->locked_until instanceof Carbon && $user->locked_until->isFuture();
    }

    private function lockAvailableIn(User $user): int
    {
        if (! ($user->locked_until instanceof Carbon)) {
            return 0;
        }

        return now()->diffInSeconds($user->locked_until);
    }

    private function normalizeEmail(string $email): string
    {
        return Str::lower(trim($email));
    }
}

<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasUuid, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'country',
        'city',
        'township',
        'profile_image_path',
        'role_id',
        'is_active',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'failed_login_attempts' => 'integer',
            'locked_until' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class);
    }

    public function workSchedules(): HasMany
    {
        return $this->hasMany(WorkSchedule::class);
    }

    public function blogs(): HasMany
    {
        return $this->hasMany(Blog::class, 'author_user_id');
    }

    public function blogComments(): HasMany
    {
        return $this->hasMany(BlogComment::class, 'commenter_user_id');
    }

    public function conversationMembers(): HasMany
    {
        return $this->hasMany(ConversationMember::class);
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_user_id');
    }

    public function uploadedDocuments(): HasMany
    {
        return $this->hasMany(Document::class, 'uploaded_by_user_id');
    }

    public function documentComments(): HasMany
    {
        return $this->hasMany(DocumentComment::class, 'commenter_user_id');
    }

    public function resolveRouteBinding($value, $field = null): ?Model
    {
        if ($field !== null) {
            return parent::resolveRouteBinding($value, $field);
        }

        $query = $this->newQuery();

        if (is_numeric($value)) {
            return $query
                ->whereKey($value)
                ->orWhere('uuid', (string) $value)
                ->first();
        }

        return $query->where('uuid', (string) $value)->first();
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function hasRole(string $code): bool
    {
        $normalizedCode = self::normalizeRoleCode($code);

        if ($normalizedCode === null) {
            return false;
        }

        if ($this->relationLoaded('role')) {
            return strtoupper((string) $this->role?->code) === $normalizedCode;
        }

        return strtoupper((string) $this->role()->value('code')) === $normalizedCode;
    }

    /**
     * @param  iterable<string>  $codes
     */
    public function hasAnyRole(iterable $codes): bool
    {
        $normalizedCodes = self::normalizeRoleCodes($codes);

        if ($normalizedCodes === []) {
            return false;
        }

        if ($this->relationLoaded('role')) {
            $assignedCode = self::normalizeRoleCode((string) $this->role?->code);

            return $assignedCode !== null && in_array($assignedCode, $normalizedCodes, true);
        }

        $assignedCode = self::normalizeRoleCode((string) $this->role()->value('code'));

        return $assignedCode !== null && in_array($assignedCode, $normalizedCodes, true);
    }

    private static function normalizeRoleCode(string $code): ?string
    {
        $normalizedCode = strtoupper(trim($code));

        return $normalizedCode === '' ? null : $normalizedCode;
    }

    /**
     * @param  iterable<string>  $codes
     * @return list<string>
     */
    private static function normalizeRoleCodes(iterable $codes): array
    {
        $normalizedCodes = [];

        foreach ($codes as $code) {
            $normalizedCode = self::normalizeRoleCode((string) $code);

            if ($normalizedCode !== null) {
                $normalizedCodes[] = $normalizedCode;
            }
        }

        return array_values(array_unique($normalizedCodes));
    }
}

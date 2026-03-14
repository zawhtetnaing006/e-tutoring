<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasFactory;

    public const ADMIN = 'ADMIN';
    public const STAFF = 'STAFF';
    public const STUDENT = 'STUDENT';
    public const TUTOR = 'TUTOR';

    public const CODES = [
        self::ADMIN,
        self::STAFF,
        self::STUDENT,
        self::TUTOR,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}

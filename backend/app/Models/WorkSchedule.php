<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkSchedule extends Model
{
    use HasFactory;

    public const MONDAY = 'MONDAY';
    public const TUESDAY = 'TUESDAY';
    public const WEDNESDAY = 'WEDNESDAY';
    public const THURSDAY = 'THURSDAY';
    public const FRIDAY = 'FRIDAY';
    public const SATURDAY = 'SATURDAY';
    public const SUNDAY = 'SUNDAY';

    public const DAYS_OF_WEEK = [
        self::MONDAY,
        self::TUESDAY,
        self::WEDNESDAY,
        self::THURSDAY,
        self::FRIDAY,
        self::SATURDAY,
        self::SUNDAY,
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'day_of_week',
        'from_time',
        'to_time',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

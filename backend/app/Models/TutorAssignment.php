<?php

namespace App\Models;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TutorAssignment extends Model
{
    use HasFactory;

    public const STATUS_ACTIVE = 'ACTIVE';
    public const STATUS_INACTIVE = 'INACTIVE';

    protected $table = 'tutor_assignments';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tutor_user_id',
        'student_user_id',
        'start_date',
        'end_date',
        'status',
    ];

    public static function resolveStatusForDate(
        string|CarbonInterface $startDate,
        string|CarbonInterface $endDate,
        ?CarbonInterface $date = null
    ): string {
        $targetDate = ($date ?? now())->copy()->startOfDay();
        $normalizedStartDate = ($startDate instanceof CarbonInterface ? $startDate : Carbon::parse($startDate))->copy()->startOfDay();
        $normalizedEndDate = ($endDate instanceof CarbonInterface ? $endDate : Carbon::parse($endDate))->copy()->startOfDay();

        return $targetDate->betweenIncluded($normalizedStartDate, $normalizedEndDate)
            ? self::STATUS_ACTIVE
            : self::STATUS_INACTIVE;
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_user_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_user_id');
    }
}

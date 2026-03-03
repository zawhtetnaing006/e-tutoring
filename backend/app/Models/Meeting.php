<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meeting extends Model
{
    use HasFactory;

    protected $table = 'meeting';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'description',
        'type',
        'platform',
        'link',
        'class_id',
    ];

    public function classRoom(): BelongsTo
    {
        return $this->belongsTo(ClassRoom::class, 'class_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(MeetingSchedule::class, 'meeting_id');
    }
}

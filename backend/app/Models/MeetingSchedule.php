<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingSchedule extends Model
{
    use HasFactory;

    protected $table = 'meeting_schedule';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'meeting_id',
        'date',
        'start_time',
        'end_time',
    ];

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class, 'meeting_id');
    }
}

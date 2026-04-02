<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingAttendee extends Model
{
    use HasFactory;

    protected $table = 'meeting_attendees';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'meeting_id',
        'meeting_schedule_id',
        'user_id',
        'status',
    ];

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class, 'meeting_id');
    }

    public function meetingSchedule(): BelongsTo
    {
        return $this->belongsTo(MeetingSchedule::class, 'meeting_schedule_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

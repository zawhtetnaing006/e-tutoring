<?php

namespace App\Models;

use App\Models\TutorAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TutorAssignmentMessage extends Model
{
    use HasFactory;

    protected $table = 'messages';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tutor_assignment_id',
        'sender_user_id',
        'content',
    ];

    public function tutorAssignment(): BelongsTo
    {
        return $this->belongsTo(TutorAssignment::class, 'tutor_assignment_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }
}

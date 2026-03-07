<?php

namespace App\Models;

use App\Models\ClassRoomMessage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassRoom extends Model
{
    use HasFactory;

    protected $table = 'classRoom';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tutor_user_id',
        'student_user_id',
        'start_date',
        'end_date',
    ];

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_user_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_user_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ClassRoomMessage::class, 'class_id');
    }
}

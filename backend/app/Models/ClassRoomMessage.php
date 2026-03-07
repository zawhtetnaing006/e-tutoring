<?php

namespace App\Models;

use App\Models\ClassRoom;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassRoomMessage extends Model
{
    use HasFactory;

    protected $table = 'classRoomMessages';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'class_id',
        'sender_user_id',
        'content',
    ];

    public function classRoom(): BelongsTo
    {
        return $this->belongsTo(ClassRoom::class, 'class_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }
}

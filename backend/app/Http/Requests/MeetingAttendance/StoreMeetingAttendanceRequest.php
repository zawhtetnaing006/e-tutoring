<?php

namespace App\Http\Requests\MeetingAttendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMeetingAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, \Illuminate\Contracts\Validation\ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'meeting_id' => ['required', 'integer', 'exists:meeting,id'],
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
                Rule::unique('meeting_attendees', 'user_id')
                    ->where(fn ($query) => $query->where('meeting_id', $this->input('meeting_id'))),
            ],
            'status' => ['required', Rule::in(['presence', 'onleave'])],
        ];
    }
}

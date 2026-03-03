<?php

namespace App\Http\Requests\Meeting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateMeetingScheduleRequest extends FormRequest
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
            'date' => ['sometimes', 'date'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i'],
            'note' => ['sometimes', 'nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $meetingSchedule = $this->route('meetingSchedule');

            $start = $this->input('start_time', $meetingSchedule?->start_time);
            $end = $this->input('end_time', $meetingSchedule?->end_time);

            if (! is_string($start) || ! is_string($end)) {
                return;
            }

            if (strtotime($end) <= strtotime($start)) {
                $validator->errors()->add('end_time', 'The end_time must be a time after start_time.');
            }
        });
    }
}

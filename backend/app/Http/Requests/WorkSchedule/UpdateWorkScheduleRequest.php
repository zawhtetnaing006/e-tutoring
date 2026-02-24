<?php

namespace App\Http\Requests\WorkSchedule;

use App\Models\WorkSchedule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWorkScheduleRequest extends FormRequest
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
            'day_of_week' => ['sometimes', Rule::in(WorkSchedule::DAYS_OF_WEEK)],
            'from_time' => ['sometimes', 'date_format:H:i'],
            'to_time' => ['sometimes', 'date_format:H:i', 'after:from_time'],
        ];
    }
}

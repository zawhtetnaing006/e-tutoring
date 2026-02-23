<?php

namespace App\Http\Requests\WorkSchedule;

use App\Models\WorkSchedule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreWorkScheduleRequest extends FormRequest
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
            'user_id' => ['required', 'string', 'max:64'],
            'schedules' => ['required', 'array', 'min:1'],
            'schedules.*.day_of_week' => ['required', Rule::in(WorkSchedule::DAYS_OF_WEEK)],
            'schedules.*.from_time' => ['required', 'date_format:H:i'],
            'schedules.*.to_time' => ['required', 'date_format:H:i'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $schedules = $this->input('schedules', []);

            foreach ($schedules as $index => $schedule) {
                $from = $schedule['from_time'] ?? null;
                $to = $schedule['to_time'] ?? null;

                if (! is_string($from) || ! is_string($to)) {
                    continue;
                }

                if (strtotime($to) <= strtotime($from)) {
                    $validator->errors()->add(
                        "schedules.{$index}.to_time",
                        'The to_time must be a time after from_time.'
                    );
                }
            }
        });
    }
}

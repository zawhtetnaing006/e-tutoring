<?php

namespace App\Http\Requests\Meeting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreMeetingRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', Rule::in(['VIRTUAL', 'PHYSICAL'])],
            'platform' => ['nullable', 'string', 'max:255'],
            'link' => ['nullable', 'string', 'max:1000'],
            'location' => ['nullable', 'string'],
            'tutor_assignment_id' => ['required', 'integer', 'exists:tutor_assignments,id'],
            'meeting_schedules' => ['required', 'array', 'min:1'],
            'meeting_schedules.*.date' => ['required', 'date'],
            'meeting_schedules.*.start_time' => ['required', 'date_format:H:i'],
            'meeting_schedules.*.end_time' => ['required', 'date_format:H:i'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $type = (string) $this->input('type', '');
            $link = $this->input('link');
            $location = $this->input('location');

            if ($type === 'VIRTUAL' && (! is_string($link) || trim($link) === '')) {
                $validator->errors()->add('link', 'The link field is required when type is VIRTUAL.');
            }

            if ($type === 'PHYSICAL' && $link !== null && trim((string) $link) !== '') {
                $validator->errors()->add('link', 'The link must be null/empty when type is PHYSICAL.');
            }

            if ($type === 'PHYSICAL' && (! is_string($location) || trim($location) === '')) {
                $validator->errors()->add('location', 'The location field is required when type is PHYSICAL.');
            }

            if ($type === 'VIRTUAL' && $location !== null && trim((string) $location) !== '') {
                $validator->errors()->add('location', 'The location must be null/empty when type is VIRTUAL.');
            }

            $schedules = $this->input('meeting_schedules', []);

            foreach ($schedules as $index => $schedule) {
                $start = $schedule['start_time'] ?? null;
                $end = $schedule['end_time'] ?? null;

                if (! is_string($start) || ! is_string($end)) {
                    continue;
                }

                if (strtotime($end) <= strtotime($start)) {
                    $validator->errors()->add(
                        "meeting_schedules.{$index}.end_time",
                        'The end_time must be a time after start_time.'
                    );
                }
            }
        });
    }
}

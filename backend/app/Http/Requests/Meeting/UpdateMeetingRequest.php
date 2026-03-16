<?php

namespace App\Http\Requests\Meeting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateMeetingRequest extends FormRequest
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
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'type' => ['sometimes', Rule::in(['VIRTUAL', 'PHYSICAL'])],
            'platform' => ['sometimes', 'nullable', 'string', 'max:255'],
            'link' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'location' => ['sometimes', 'nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $meeting = $this->route('meeting');
            $type = (string) $this->input('type', $meeting?->type);
            $link = $this->input('link', $meeting?->link);
            $location = $this->input('location', $meeting?->location);

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
        });
    }
}

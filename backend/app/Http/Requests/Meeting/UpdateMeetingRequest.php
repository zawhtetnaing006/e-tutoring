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
            'type' => ['sometimes', Rule::in(['virtual', 'physical'])],
            'platform' => ['sometimes', 'nullable', 'string', 'max:255'],
            'link' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $meeting = $this->route('meeting');
            $type = (string) $this->input('type', $meeting?->type);
            $link = $this->input('link', $meeting?->link);

            if ($type === 'virtual' && (! is_string($link) || trim($link) === '')) {
                $validator->errors()->add('link', 'The link field is required when type is virtual.');
            }

            if ($type === 'physical' && $link !== null && trim((string) $link) !== '') {
                $validator->errors()->add('link', 'The link must be null/empty when type is physical.');
            }
        });
    }
}

<?php

namespace App\Http\Requests\Subject;

use App\Models\Subject;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubjectRequest extends FormRequest
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
        /** @var Subject|null $subject */
        $subject = $this->route('subject');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('subjects', 'name')->ignore($subject?->id),
            ],
        ];
    }
}

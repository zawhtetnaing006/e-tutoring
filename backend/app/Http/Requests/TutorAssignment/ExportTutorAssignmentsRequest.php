<?php

namespace App\Http\Requests\TutorAssignment;

use Illuminate\Foundation\Http\FormRequest;

class ExportTutorAssignmentsRequest extends FormRequest
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
            'tutor_assignment_ids' => ['required', 'array', 'min:1'],
            'tutor_assignment_ids.*' => ['integer', 'distinct', 'exists:tutor_assignments,id'],
        ];
    }
}

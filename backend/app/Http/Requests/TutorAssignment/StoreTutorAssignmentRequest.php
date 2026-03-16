<?php

namespace App\Http\Requests\TutorAssignment;

use Closure;
use App\Models\TutorAssignment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreTutorAssignmentRequest extends FormRequest
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
            'tutor_user_id' => [
                'required',
                'integer',
                'exists:users,id',
                $this->ensureUserHasRole(Role::TUTOR, 'tutor'),
            ],
            'student_user_ids' => ['required', 'array', 'min:1'],
            'student_user_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:users,id',
                $this->ensureUserHasRole(Role::STUDENT, 'student'),
            ],
            'from_date' => ['required', 'date'],
            'to_date' => ['required', 'date', 'after_or_equal:from_date'],
            'status' => ['nullable', 'in:ACTIVE,INACTIVE'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $tutorUserId = $this->input('tutor_user_id');
            $studentUserIds = $this->input('student_user_ids', []);

            if (! is_numeric($tutorUserId) || ! is_array($studentUserIds) || $studentUserIds === []) {
                return;
            }

            $existingStudentIds = TutorAssignment::query()
                ->where('tutor_user_id', (int) $tutorUserId)
                ->whereIn('student_user_id', $studentUserIds)
                ->pluck('student_user_id')
                ->all();

            $userNames = User::query()
                ->whereIn('id', [(int) $tutorUserId, ...array_map('intval', $existingStudentIds)])
                ->pluck('name', 'id');

            $tutorName = $userNames->get((int) $tutorUserId, "Tutor #{$tutorUserId}");

            foreach ($existingStudentIds as $studentUserId) {
                $studentName = $userNames->get((int) $studentUserId, "Student #{$studentUserId}");

                $validator->errors()->add(
                    'student_user_ids',
                    "Tutor assignment already exists for {$tutorName} and {$studentName}."
                );
            }
        });
    }

    private function ensureUserHasRole(string $roleCode, string $label): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($roleCode, $label): void {
            if (! is_numeric($value)) {
                return;
            }

            $user = User::query()->find((int) $value);

            if ($user === null || ! $user->hasRole($roleCode)) {
                $fail("The selected {$attribute} must belong to a {$label}.");
            }
        };
    }
}

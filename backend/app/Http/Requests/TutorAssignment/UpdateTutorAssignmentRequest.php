<?php

namespace App\Http\Requests\TutorAssignment;

use Closure;
use App\Models\TutorAssignment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateTutorAssignmentRequest extends FormRequest
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
                'sometimes',
                'integer',
                'exists:users,id',
                $this->ensureUserHasRole(Role::TUTOR, 'tutor'),
            ],
            'student_user_id' => [
                'sometimes',
                'integer',
                'exists:users,id',
                $this->ensureUserHasRole(Role::STUDENT, 'student'),
            ],
            'from_date' => ['sometimes', 'date'],
            'to_date' => ['sometimes', 'date'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var TutorAssignment|null $tutorAssignment */
            $tutorAssignment = $this->route('tutorAssignment');

            if ($tutorAssignment === null) {
                return;
            }

            $tutorUserId = (int) ($this->input('tutor_user_id', $tutorAssignment->tutor_user_id));
            $studentUserId = (int) ($this->input('student_user_id', $tutorAssignment->student_user_id));
            $fromDate = (string) ($this->input('from_date', $tutorAssignment->start_date));
            $toDate = (string) ($this->input('to_date', $tutorAssignment->end_date));

            if ($fromDate !== '' && $toDate !== '' && strtotime($toDate) < strtotime($fromDate)) {
                $validator->errors()->add('to_date', 'The to_date must be a date after or equal to from_date.');
            }

            $exists = TutorAssignment::query()
                ->where('tutor_user_id', $tutorUserId)
                ->where('student_user_id', $studentUserId)
                ->whereKeyNot($tutorAssignment->id)
                ->exists();

            if ($exists) {
                $userNames = User::query()
                    ->whereIn('id', [$tutorUserId, $studentUserId])
                    ->pluck('name', 'id');
                $tutorName = $userNames->get($tutorUserId, "Tutor #{$tutorUserId}");
                $studentName = $userNames->get($studentUserId, "Student #{$studentUserId}");

                $validator->errors()->add(
                    'student_user_id',
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

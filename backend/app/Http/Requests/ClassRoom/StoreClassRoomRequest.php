<?php

namespace App\Http\Requests\ClassRoom;

use App\Models\ClassRoom;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreClassRoomRequest extends FormRequest
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
                Rule::exists('users', 'id')->where('user_type', User::TYPE_TUTOR),
            ],
            'student_user_ids' => ['required', 'array', 'min:1'],
            'student_user_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('users', 'id')->where('user_type', User::TYPE_STUDENT),
            ],
            'from_date' => ['required', 'date'],
            'to_date' => ['required', 'date', 'after_or_equal:from_date'],
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

            $existingStudentIds = ClassRoom::query()
                ->where('tutor_user_id', (int) $tutorUserId)
                ->whereIn('student_user_id', $studentUserIds)
                ->pluck('student_user_id')
                ->all();

            foreach ($existingStudentIds as $studentUserId) {
                $validator->errors()->add(
                    'student_user_ids',
                    "Class already exists for tutor_user_id {$tutorUserId} and student_user_id {$studentUserId}."
                );
            }
        });
    }
}

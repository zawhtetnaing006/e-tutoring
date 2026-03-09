<?php

namespace App\Http\Requests\ClassRoom;

use App\Models\ClassRoom;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateClassRoomRequest extends FormRequest
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
                Rule::exists('users', 'id')->where('user_type', User::TYPE_TUTOR),
            ],
            'student_user_id' => [
                'sometimes',
                'integer',
                Rule::exists('users', 'id')->where('user_type', User::TYPE_STUDENT),
            ],
            'from_date' => ['sometimes', 'date'],
            'to_date' => ['sometimes', 'date'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var ClassRoom|null $classRoom */
            $classRoom = $this->route('classRoom');

            if ($classRoom === null) {
                return;
            }

            $tutorUserId = (int) ($this->input('tutor_user_id', $classRoom->tutor_user_id));
            $studentUserId = (int) ($this->input('student_user_id', $classRoom->student_user_id));
            $fromDate = (string) ($this->input('from_date', $classRoom->start_date));
            $toDate = (string) ($this->input('to_date', $classRoom->end_date));

            if ($fromDate !== '' && $toDate !== '' && strtotime($toDate) < strtotime($fromDate)) {
                $validator->errors()->add('to_date', 'The to_date must be a date after or equal to from_date.');
            }

            $exists = ClassRoom::query()
                ->where('tutor_user_id', $tutorUserId)
                ->where('student_user_id', $studentUserId)
                ->whereKeyNot($classRoom->id)
                ->exists();

            if ($exists) {
                $userNames = User::query()
                    ->whereIn('id', [$tutorUserId, $studentUserId])
                    ->pluck('name', 'id');
                $tutorName = $userNames->get($tutorUserId, "Tutor #{$tutorUserId}");
                $studentName = $userNames->get($studentUserId, "Student #{$studentUserId}");

                $validator->errors()->add(
                    'student_user_id',
                    "Class already exists for {$tutorName} and {$studentName}."
                );
            }
        });
    }
}

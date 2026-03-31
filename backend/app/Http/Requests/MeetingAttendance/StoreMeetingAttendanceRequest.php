<?php

namespace App\Http\Requests\MeetingAttendance;

use App\Models\Meeting;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreMeetingAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user instanceof User) {
            return false;
        }

        $meetingId = (int) $this->input('meeting_id');

        if ($meetingId < 1) {
            return false;
        }

        $meeting = Meeting::query()
            ->with('tutorAssignment')
            ->find($meetingId);

        if (! $meeting instanceof Meeting) {
            return false;
        }

        if ($user->hasRole(Role::ADMIN) || $user->hasRole(Role::STAFF)) {
            return true;
        }

        if ($user->hasRole(Role::TUTOR)) {
            return (int) $meeting->tutorAssignment?->tutor_user_id === (int) $user->id;
        }

        return false;
    }

    /**
     * @return array<string, array<int, \Illuminate\Contracts\Validation\ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'meeting_id' => ['required', 'integer', 'exists:meeting,id'],
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
                Rule::unique('meeting_attendees', 'user_id')
                    ->where(fn ($query) => $query->where('meeting_id', $this->input('meeting_id'))),
            ],
            'status' => ['required', Rule::in(['PRESENCE', 'ABSENCE', 'ON_LEAVE'])],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $meetingId = (int) $this->input('meeting_id');
            $userId = (int) $this->input('user_id');

            if ($meetingId < 1 || $userId < 1) {
                return;
            }

            $meeting = Meeting::query()
                ->with('tutorAssignment')
                ->find($meetingId);

            if (! $meeting instanceof Meeting) {
                return;
            }

            $studentUserId = (int) ($meeting->tutorAssignment?->student_user_id ?? 0);

            if ($studentUserId > 0 && $userId !== $studentUserId) {
                $validator->errors()->add(
                    'user_id',
                    'Attendance can only be recorded for the assigned student.'
                );
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.unique' => 'Attendance has already been recorded for this student in this meeting.',
        ];
    }
}

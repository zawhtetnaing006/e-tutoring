<?php

namespace App\Http\Requests\MeetingAttendance;

use App\Models\MeetingSchedule;
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

        $meetingScheduleId = (int) $this->input('meeting_schedule_id');

        if ($meetingScheduleId < 1) {
            return false;
        }

        $meetingSchedule = MeetingSchedule::query()
            ->with('meeting.tutorAssignment')
            ->find($meetingScheduleId);

        if (! $meetingSchedule instanceof MeetingSchedule) {
            return false;
        }

        if ($user->hasRole(Role::ADMIN) || $user->hasRole(Role::STAFF)) {
            return true;
        }

        if ($user->hasRole(Role::TUTOR)) {
            return (int) $meetingSchedule->meeting?->tutorAssignment?->tutor_user_id === (int) $user->id;
        }

        return false;
    }

    /**
     * @return array<string, array<int, \Illuminate\Contracts\Validation\ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'meeting_schedule_id' => ['required', 'integer', 'exists:meeting_schedule,id'],
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
                Rule::unique('meeting_attendees', 'user_id')
                    ->where(fn ($query) => $query->where('meeting_schedule_id', $this->input('meeting_schedule_id'))),
            ],
            'status' => ['required', Rule::in(['PRESENCE', 'ABSENCE', 'ON_LEAVE'])],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $meetingScheduleId = (int) $this->input('meeting_schedule_id');
            $userId = (int) $this->input('user_id');

            if ($meetingScheduleId < 1 || $userId < 1) {
                return;
            }

            $meetingSchedule = MeetingSchedule::query()
                ->with('meeting.tutorAssignment')
                ->find($meetingScheduleId);

            if (! $meetingSchedule instanceof MeetingSchedule) {
                return;
            }

            if ($meetingSchedule->cancel_at !== null) {
                $validator->errors()->add(
                    'meeting_schedule_id',
                    'Attendance cannot be recorded for a cancelled schedule.'
                );

                return;
            }

            $studentUserId = (int) ($meetingSchedule->meeting?->tutorAssignment?->student_user_id ?? 0);

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
            'user_id.unique' => 'Attendance has already been recorded for this student in this schedule.',
        ];
    }
}

<?php

namespace App\Policies;

use App\Models\Meeting;
use App\Models\Role;
use App\Models\User;

class MeetingPolicy
{
    public function view(User $user, Meeting $meeting): bool
    {
        if ($this->staffOrAssignedTutor($user, $meeting)) {
            return true;
        }

        if ($user->hasRole(Role::STUDENT)) {
            $meeting->loadMissing('tutorAssignment');

            return (int) $meeting->tutorAssignment?->student_user_id === (int) $user->id;
        }

        return false;
    }

    public function update(User $user, Meeting $meeting): bool
    {
        return $this->staffOrAssignedTutor($user, $meeting);
    }

    public function delete(User $user, Meeting $meeting): bool
    {
        return $this->staffOrAssignedTutor($user, $meeting);
    }

    private function staffOrAssignedTutor(User $user, Meeting $meeting): bool
    {
        if ($user->hasRole(Role::ADMIN) || $user->hasRole(Role::STAFF)) {
            return true;
        }

        if ($user->hasRole(Role::TUTOR)) {
            $meeting->loadMissing('tutorAssignment');

            return (int) $meeting->tutorAssignment?->tutor_user_id === (int) $user->id;
        }

        return false;
    }
}

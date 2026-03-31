<?php

namespace App\Http\Resources;

use App\Models\Activity;
use App\Models\Blog;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\MeetingSchedule;
use App\Models\Subject;
use App\Models\TutorAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Activity $resource
 */
class AuditLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $activity = $this->resource;
        $meta = $this->propertiesArray($activity->getExtraProperty('meta', []));
        $target = $this->targetLabel($activity, $meta);

        return [
            'id' => $activity->id,
            'date_time' => $activity->created_at?->toISOString(),
            'actor' => $this->actorLabel($activity),
            'action' => (string) ($meta['action_label'] ?? $activity->description),
            'target' => $target,
            'description' => $this->descriptionLabel($meta, $target),
        ];
    }

    private function actorLabel(Activity $activity): string
    {
        $user = $this->actorUser($activity);

        if (! $user instanceof User) {
            return 'System (Service)';
        }

        $user->loadMissing('role:id,code,name');
        $role = trim((string) ($user->role?->name ?? ''));

        if ($role === '') {
            $role = trim((string) ($user->role?->code ?? 'User'));
        }

        return sprintf('%s (%s)', $user->name, $role);
    }

    private function actorUser(Activity $activity): ?User
    {
        if ($activity->causer instanceof User) {
            return $activity->causer;
        }

        if (str_starts_with($activity->description, 'auth.') && $activity->subject instanceof User) {
            return $activity->subject;
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function targetLabel(Activity $activity, array $meta): string
    {
        $subjectLabel = $this->subjectLabel($activity);
        if ($subjectLabel !== null) {
            return $subjectLabel;
        }

        return $this->humanizeAuditText((string) ($meta['target_label'] ?? 'System'));
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function descriptionLabel(array $meta, string $targetLabel): string
    {
        $description = trim((string) ($meta['description'] ?? ''));
        if ($description === '') {
            return '';
        }

        $rawTargetLabel = trim((string) ($meta['target_label'] ?? ''));
        if ($rawTargetLabel !== '' && $rawTargetLabel !== $targetLabel) {
            $description = str_replace($rawTargetLabel, $targetLabel, $description);
        }

        return $this->humanizeAuditText($description);
    }

    private function subjectLabel(Activity $activity): ?string
    {
        $subject = $activity->subject;

        if ($subject instanceof User) {
            return 'User: ' . $this->userLabel($subject);
        }

        if ($subject instanceof Subject) {
            $name = trim((string) $subject->name);

            return $name === '' ? null : 'Subject: ' . $name;
        }

        if ($subject instanceof Blog) {
            $title = trim((string) $subject->title);

            return $title === '' ? null : 'Blog: ' . $title;
        }

        if ($subject instanceof Meeting) {
            $title = trim((string) $subject->title);

            return $title === '' ? null : 'Meeting: ' . $title;
        }

        if ($subject instanceof MeetingSchedule) {
            $meetingTitle = trim((string) ($subject->meeting?->title ?? ''));
            $date = trim((string) $subject->date);

            if ($meetingTitle === '' && $date === '') {
                return null;
            }

            if ($meetingTitle !== '' && $date !== '') {
                return sprintf('Meeting Schedule: %s on %s', $meetingTitle, $date);
            }

            return 'Meeting Schedule: ' . ($meetingTitle !== '' ? $meetingTitle : $date);
        }

        if ($subject instanceof MeetingAttendee) {
            $userName = trim((string) ($subject->user?->name ?? ''));
            $meetingTitle = trim((string) ($subject->meeting?->title ?? ''));

            if ($userName !== '' && $meetingTitle !== '') {
                return sprintf('Meeting Attendance: %s for %s', $userName, $meetingTitle);
            }

            if ($userName !== '') {
                return 'Meeting Attendance: ' . $userName;
            }

            if ($meetingTitle !== '') {
                return 'Meeting Attendance: ' . $meetingTitle;
            }

            return null;
        }

        if ($subject instanceof TutorAssignment) {
            $tutorName = trim((string) ($subject->tutor?->name ?? ''));
            $studentName = trim((string) ($subject->student?->name ?? ''));

            if ($tutorName !== '' && $studentName !== '') {
                return sprintf('Tutor Assignment: %s -> %s', $tutorName, $studentName);
            }
        }

        return null;
    }

    private function userLabel(User $user): string
    {
        $user->loadMissing('role:id,code,name');
        $role = trim((string) ($user->role?->name ?? $user->role?->code ?? ''));

        if ($role === '') {
            return $user->name;
        }

        return sprintf('%s (%s)', $user->name, $role);
    }

    private function humanizeAuditText(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            return $value;
        }

        $value = (string) preg_replace('/#(\d+)/', ' $1', $value);
        $value = (string) preg_replace('/\s+/', ' ', $value);

        return trim($value);
    }

    /**
     * @return array<string, mixed>
     */
    private function propertiesArray(mixed $value): array
    {
        return is_array($value) ? $value : [];
    }
}

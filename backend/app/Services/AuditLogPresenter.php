<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Blog;
use App\Models\Meeting;
use App\Models\MeetingAttendee;
use App\Models\MeetingSchedule;
use App\Models\Subject;
use App\Models\TutorAssignment;
use App\Models\User;
use Illuminate\Support\Str;

class AuditLogPresenter
{
    /**
     * @return array{actor:string,action:string,target:string,description:string}
     */
    public function present(Activity $activity): array
    {
        $meta = $this->propertiesArray($activity->getExtraProperty('meta', []));
        $target = $this->targetLabel($activity, $meta);

        return [
            'actor' => $this->actorLabel($activity),
            'action' => $this->actionLabel($activity, $meta),
            'target' => $target,
            'description' => $this->descriptionLabel($activity, $meta, $target),
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
    private function actionLabel(Activity $activity, array $meta): string
    {
        $action = trim((string) ($meta['action_label'] ?? $activity->description));

        return $action === '' ? 'UNKNOWN_ACTION' : $action;
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function targetLabel(Activity $activity, array $meta): string
    {
        $rawTargetLabel = trim((string) ($meta['target_label'] ?? ''));

        if ($rawTargetLabel !== '') {
            return $this->normalizeAuditText($rawTargetLabel);
        }

        $subjectLabel = $this->compactSubjectLabel($activity);

        if ($subjectLabel !== null) {
            return $subjectLabel;
        }

        return 'System';
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function descriptionLabel(Activity $activity, array $meta, string $targetLabel): string
    {
        $description = trim((string) ($meta['description'] ?? ''));

        if ($description === '') {
            return $this->generatedDescription($activity, $meta, $targetLabel);
        }

        $rawTargetLabel = trim((string) ($meta['target_label'] ?? ''));
        if ($rawTargetLabel !== '' && $rawTargetLabel !== $targetLabel) {
            $description = str_replace($rawTargetLabel, $targetLabel, $description);
        }

        return $this->normalizeAuditText($description);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function generatedDescription(Activity $activity, array $meta, string $targetLabel): string
    {
        $operation = trim((string) ($meta['operation'] ?? ''));

        return match ($operation) {
            'created' => sprintf('Created %s.', $targetLabel),
            'deleted' => sprintf('Deleted %s.', $targetLabel),
            'updated' => $this->updatedDescription($targetLabel, $meta),
            'status_updated' => $this->statusUpdatedDescription($targetLabel, $meta),
            'counted' => $this->countedDescription($meta),
            'login' => sprintf('%s logged in successfully.', $this->activityUserName($activity, $targetLabel)),
            'logout' => sprintf('%s logged out.', $this->activityUserName($activity, $targetLabel)),
            'reset_password' => sprintf('%s reset password successfully.', $this->activityUserName($activity, $targetLabel)),
            'cancelled' => sprintf('Cancelled %s.', $targetLabel),
            'recorded_attendance' => sprintf('Recorded attendance for %s.', $targetLabel),
            'inactivity_threshold_reached' => $this->inactivityDescription($targetLabel, $meta),
            default => $this->fallbackDescription($activity, $targetLabel, $meta),
        };
    }

    private function compactSubjectLabel(Activity $activity): ?string
    {
        $subject = $activity->subject;

        if ($subject instanceof User) {
            $subject->loadMissing('role:id,code,name');
            $role = trim((string) ($subject->role?->name ?? $subject->role?->code ?? 'User'));
            $role = str_replace(' ', '', $role);

            return sprintf('%s#%d', $role === '' ? 'User' : $role, (int) $subject->id);
        }

        if ($subject instanceof Subject) {
            return sprintf('Subject#%d', (int) $subject->id);
        }

        if ($subject instanceof Blog) {
            return sprintf('Blog#%d', (int) $subject->id);
        }

        if ($subject instanceof Meeting) {
            return sprintf('Meeting#%d', (int) $subject->id);
        }

        if ($subject instanceof MeetingSchedule) {
            return sprintf('MeetingSchedule#%d', (int) $subject->id);
        }

        if ($subject instanceof MeetingAttendee) {
            return sprintf('MeetingAttendance#%d', (int) $subject->id);
        }

        if ($subject instanceof TutorAssignment) {
            return sprintf('TutorAssignment#%d', (int) $subject->id);
        }

        return null;
    }

    private function normalizeAuditText(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            return $value;
        }

        $value = (string) preg_replace('/\s+/', ' ', $value);

        return trim($value);
    }

    private function humanizeActionText(string $value): string
    {
        $normalized = str_replace(['.', '_'], ' ', trim($value));
        $normalized = (string) preg_replace('/\s+/', ' ', $normalized);

        return Str::title(strtolower($normalized));
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function fallbackDescription(Activity $activity, string $targetLabel, array $meta): string
    {
        $baseAction = trim((string) ($meta['action_label'] ?? $activity->description));
        $action = $this->humanizeActionText($baseAction);

        if ($targetLabel === '' || $targetLabel === 'System') {
            return $action . '.';
        }

        return sprintf('%s: %s.', $action, $targetLabel);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function updatedDescription(string $targetLabel, array $meta): string
    {
        $labels = $this->stringList($meta['field_labels'] ?? []);

        if ($labels === []) {
            return sprintf('Updated %s.', $targetLabel);
        }

        return sprintf('Updated %s: %s.', $targetLabel, implode(', ', $labels));
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function statusUpdatedDescription(string $targetLabel, array $meta): string
    {
        $statusValue = trim((string) ($meta['status_value'] ?? ''));

        if ($statusValue === '') {
            return sprintf('Updated %s status.', $targetLabel);
        }

        return sprintf('Updated %s status to %s.', $targetLabel, $statusValue);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function countedDescription(array $meta): string
    {
        $count = max(0, (int) ($meta['count'] ?? 0));
        $verb = trim((string) ($meta['count_verb'] ?? 'processed'));
        $itemLabel = trim((string) ($meta['item_label'] ?? 'items'));

        return sprintf('%s %d %s.', Str::ucfirst($verb), $count, $itemLabel);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private function inactivityDescription(string $targetLabel, array $meta): string
    {
        $daysInactive = max(0, (int) ($meta['days_inactive'] ?? 0));
        $latestActivityAt = trim((string) ($meta['latest_activity_at'] ?? ''));

        if ($latestActivityAt === '') {
            return sprintf('%s is inactive for %d days.', $targetLabel, $daysInactive);
        }

        return sprintf(
            '%s is inactive for %d days (latest activity at %s).',
            $targetLabel,
            $daysInactive,
            $latestActivityAt,
        );
    }

    private function activityUserName(Activity $activity, string $fallback): string
    {
        $user = $this->actorUser($activity);

        if ($user instanceof User) {
            $name = trim((string) $user->name);

            if ($name !== '') {
                return $name;
            }
        }

        if ($activity->subject instanceof User) {
            $name = trim((string) $activity->subject->name);

            if ($name !== '') {
                return $name;
            }
        }

        return $fallback;
    }

    /**
     * @return array<string>
     */
    private function stringList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter(
            array_map(
                static fn (mixed $item): string => trim((string) $item),
                $value,
            ),
            static fn (string $item): bool => $item !== '',
        ));
    }

    /**
     * @return array<string, mixed>
     */
    private function propertiesArray(mixed $value): array
    {
        return is_array($value) ? $value : [];
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Activity;
use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use App\Notifications\InactiveUserReminderNotification;
use App\Notifications\StudentInactiveTutorReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Throwable;

class LogInactiveUsersCommand extends Command
{
    protected $signature = 'activity-log:log-inactive-users {--days=28 : Inactivity threshold in days}';

    protected $description = 'Log users whose latest activity is older than the configured number of days.';

    public function handle(): int
    {
        $thresholdDays = max(1, (int) $this->option('days'));
        $now = now();
        $cutoff = $now->copy()->subDays($thresholdDays);
        $today = $now->toDateString();

        $latestByUserId = $this->latestActivityByUserId();
        $checkedCount = 0;
        $loggedCount = 0;
        $emailedRecipientCount = 0;

        User::query()
            ->select(['id', 'name', 'email', 'role_id', 'created_at'])
            ->with('role:id,code')
            ->orderBy('id')
            ->chunkById(200, function ($users) use (
                $latestByUserId,
                $cutoff,
                $thresholdDays,
                $today,
                $now,
                &$checkedCount,
                &$loggedCount,
                &$emailedRecipientCount
            ): void {
                foreach ($users as $user) {
                    $checkedCount++;

                    $latestActivityAt = $latestByUserId[$user->id] ?? $user->created_at;

                    if (! $latestActivityAt instanceof Carbon) {
                        continue;
                    }

                    if ($latestActivityAt->greaterThan($cutoff)) {
                        continue;
                    }

                    if ($this->alreadyLoggedToday($user->id, $today)) {
                        continue;
                    }

                    $daysInactive = $latestActivityAt->diffInDays($now);
                    $targetLabel = sprintf('User#%d', (int) $user->id);

                    activity('audit')
                        ->performedOn($user)
                        ->withProperties([
                            'inactivity' => [
                                'threshold_days' => $thresholdDays,
                                'latest_activity_at' => $latestActivityAt->toISOString(),
                                'days_inactive' => $daysInactive,
                                'checked_at' => $now->toISOString(),
                            ],
                            'meta' => [
                                'action_label' => 'USER_INACTIVE_THRESHOLD_REACHED',
                                'target_label' => $targetLabel,
                                'description' => sprintf(
                                    '%s is inactive for %d days (latest activity at %s).',
                                    $targetLabel,
                                    $daysInactive,
                                    $latestActivityAt->toDateTimeString()
                                ),
                            ],
                        ])
                        ->event('inactivity_detected')
                        ->log('user.inactive_detected');

                    $loggedCount++;

                    $emailedRecipientCount += $this->notifyInactiveRecipients($user, $daysInactive, $latestActivityAt, $now);
                }
            });

        $this->info(sprintf(
            'Checked %d users, logged %d inactive users, and emailed %d recipients (threshold: %d days).',
            $checkedCount,
            $loggedCount,
            $emailedRecipientCount,
            $thresholdDays
        ));

        return self::SUCCESS;
    }

    /**
     * @return array<int, Carbon>
     */
    private function latestActivityByUserId(): array
    {
        $latestByUserId = [];

        Activity::query()
            ->selectRaw('actor_id as user_id, MAX(created_at) as latest_at')
            ->where('actor_type', User::class)
            ->whereNotNull('actor_id')
            ->groupBy('actor_id')
            ->orderBy('actor_id')
            ->get()
            ->each(function ($row) use (&$latestByUserId): void {
                $userId = (int) ($row->user_id ?? 0);
                $latestAt = $row->latest_at;

                if ($userId <= 0 || ! is_string($latestAt)) {
                    return;
                }

                $latestByUserId[$userId] = Carbon::parse($latestAt);
            });

        Activity::query()
            ->selectRaw('target_id as user_id, MAX(created_at) as latest_at')
            ->where('description', 'like', 'auth.%')
            ->where('target_type', User::class)
            ->whereNotNull('target_id')
            ->groupBy('target_id')
            ->orderBy('target_id')
            ->get()
            ->each(function ($row) use (&$latestByUserId): void {
                $userId = (int) ($row->user_id ?? 0);
                $latestAt = $row->latest_at;

                if ($userId <= 0 || ! is_string($latestAt)) {
                    return;
                }

                $candidate = Carbon::parse($latestAt);
                $existing = $latestByUserId[$userId] ?? null;

                if (! $existing instanceof Carbon || $candidate->greaterThan($existing)) {
                    $latestByUserId[$userId] = $candidate;
                }
            });

        return $latestByUserId;
    }

    private function alreadyLoggedToday(int $userId, string $today): bool
    {
        return Activity::query()
            ->where('description', 'user.inactive_detected')
            ->where('target_type', User::class)
            ->where('target_id', $userId)
            ->whereDate('created_at', $today)
            ->exists();
    }

    private function notifyInactiveRecipients(User $user, int $daysInactive, Carbon $latestActivityAt, Carbon $referenceDate): int
    {
        $emailedRecipientCount = 0;

        if ($this->canReceiveMail($user)) {
            try {
                $user->notify(new InactiveUserReminderNotification($daysInactive, $latestActivityAt));

                $emailedRecipientCount++;
            } catch (Throwable $exception) {
                report($exception);
            }
        }

        if (! $user->hasRole(Role::STUDENT)) {
            return $emailedRecipientCount;
        }

        $activeTutorRecipients = $this->activeTutorRecipientsForStudent($user, $referenceDate);

        if ($activeTutorRecipients->isNotEmpty()) {
            return $emailedRecipientCount + $this->notifyTutorRecipients(
                $activeTutorRecipients,
                $user,
                $daysInactive,
                $latestActivityAt,
                false
            );
        }

        return $emailedRecipientCount + $this->notifyTutorRecipients(
            $this->latestTutorRecipientsForStudent($user, $referenceDate),
            $user,
            $daysInactive,
            $latestActivityAt,
            true
        );
    }

    /**
     * @return Collection<int, User>
     */
    private function activeTutorRecipientsForStudent(User $student, Carbon $referenceDate): Collection
    {
        $today = $referenceDate->copy()->startOfDay()->toDateString();

        $tutorIds = TutorAssignment::query()
            ->where('student_user_id', $student->id)
            ->whereNotNull('tutor_user_id')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->pluck('tutor_user_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $this->loadUsersByIds($tutorIds);
    }

    /**
     * @return Collection<int, User>
     */
    private function latestTutorRecipientsForStudent(User $student, Carbon $referenceDate): Collection
    {
        $today = $referenceDate->copy()->startOfDay()->toDateString();

        $latestEndDate = TutorAssignment::query()
            ->where('student_user_id', $student->id)
            ->whereNotNull('tutor_user_id')
            ->whereDate('end_date', '<', $today)
            ->max('end_date');

        if (! is_string($latestEndDate) || trim($latestEndDate) === '') {
            return collect();
        }

        $tutorIds = TutorAssignment::query()
            ->where('student_user_id', $student->id)
            ->whereNotNull('tutor_user_id')
            ->whereDate('end_date', $latestEndDate)
            ->pluck('tutor_user_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $this->loadUsersByIds($tutorIds);
    }

    /**
     * @param  Collection<int, User>  $tutors
     */
    private function notifyTutorRecipients(
        Collection $tutors,
        User $student,
        int $daysInactive,
        Carbon $latestActivityAt,
        bool $usingLatestAssignmentFallback
    ): int {
        $emailedRecipientCount = 0;

        foreach ($tutors as $tutor) {
            if (! $tutor instanceof User || ! $this->canReceiveMail($tutor) || $tutor->is($student)) {
                continue;
            }

            try {
                $tutor->notify(new StudentInactiveTutorReminderNotification(
                    $student,
                    $daysInactive,
                    $latestActivityAt,
                    $usingLatestAssignmentFallback
                ));

                $emailedRecipientCount++;
            } catch (Throwable $exception) {
                report($exception);
            }
        }

        return $emailedRecipientCount;
    }

    /**
     * @param  array<int, int|string>  $userIds
     * @return Collection<int, User>
     */
    private function loadUsersByIds(array $userIds): Collection
    {
        $normalizedIds = array_values(array_unique(array_map('intval', $userIds)));

        if ($normalizedIds === []) {
            return collect();
        }

        return User::query()
            ->whereIn('id', $normalizedIds)
            ->orderBy('id')
            ->get(['id', 'name', 'email']);
    }

    private function canReceiveMail(User $user): bool
    {
        return is_string($user->email) && trim($user->email) !== '';
    }
}

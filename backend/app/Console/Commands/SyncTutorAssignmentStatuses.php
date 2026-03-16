<?php

namespace App\Console\Commands;

use App\Models\TutorAssignment;
use Illuminate\Console\Command;

class SyncTutorAssignmentStatuses extends Command
{
    protected $signature = 'tutor-assignments:sync-statuses';

    protected $description = 'Sync tutor assignment statuses based on start and end dates.';

    public function handle(): int
    {
        $today = now()->startOfDay();
        $updatedToActive = 0;
        $updatedToInactive = 0;

        TutorAssignment::query()
            ->select(['id', 'start_date', 'end_date', 'status'])
            ->orderBy('id')
            ->chunkById(200, function ($assignments) use ($today, &$updatedToActive, &$updatedToInactive): void {
                foreach ($assignments as $assignment) {
                    $expectedStatus = TutorAssignment::resolveStatusForDate(
                        $assignment->start_date,
                        $assignment->end_date,
                        $today
                    );

                    if ($assignment->status === $expectedStatus) {
                        continue;
                    }

                    $assignment->forceFill([
                        'status' => $expectedStatus,
                    ])->save();

                    if ($expectedStatus === TutorAssignment::STATUS_ACTIVE) {
                        $updatedToActive++;
                    } else {
                        $updatedToInactive++;
                    }
                }
            });

        $this->info(sprintf(
            'Tutor assignment statuses synced for %s. ACTIVE: %d, INACTIVE: %d.',
            $today->toDateString(),
            $updatedToActive,
            $updatedToInactive,
        ));

        return self::SUCCESS;
    }
}

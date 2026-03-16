<?php

namespace App\Console\Commands;

use App\Models\TutorAssignment;
use App\Services\ChatService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncTutorAssignmentStatuses extends Command
{
    protected $signature = 'tutor-assignments:sync-statuses';

    protected $description = 'Sync tutor assignment statuses based on start and end dates.';

    public function handle(ChatService $chatService): int
    {
        $today = now()->startOfDay();
        $updatedToActive = 0;
        $updatedToInactive = 0;
        $welcomeMessagesCreated = 0;

        TutorAssignment::query()
            ->select(['id', 'tutor_user_id', 'student_user_id', 'start_date', 'end_date', 'status'])
            ->orderBy('id')
            ->chunkById(200, function ($assignments) use ($chatService, $today, &$updatedToActive, &$updatedToInactive, &$welcomeMessagesCreated): void {
                foreach ($assignments as $assignment) {
                    $previousStatus = $assignment->status;
                    $expectedStatus = TutorAssignment::resolveStatusForDate(
                        $assignment->start_date,
                        $assignment->end_date,
                        $today
                    );

                    if ($assignment->status === $expectedStatus) {
                        continue;
                    }

                    DB::transaction(function () use ($assignment, $chatService, $expectedStatus, $previousStatus, &$welcomeMessagesCreated): void {
                        $assignment->forceFill([
                            'status' => $expectedStatus,
                        ])->save();

                        if (
                            $expectedStatus === TutorAssignment::STATUS_ACTIVE
                            && in_array($previousStatus, [null, TutorAssignment::STATUS_INACTIVE], true)
                            && $chatService->ensureAssignmentWelcomeConversation($assignment)
                        ) {
                            $welcomeMessagesCreated++;
                        }
                    });

                    if ($expectedStatus === TutorAssignment::STATUS_ACTIVE) {
                        $updatedToActive++;
                    } else {
                        $updatedToInactive++;
                    }
                }
            });

        $this->info(sprintf(
            'Tutor assignment statuses synced for %s. ACTIVE: %d, INACTIVE: %d, welcome conversations ensured: %d.',
            $today->toDateString(),
            $updatedToActive,
            $updatedToInactive,
            $welcomeMessagesCreated,
        ));

        return self::SUCCESS;
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('meeting_attendees', 'meeting_schedule_id')) {
            Schema::table('meeting_attendees', function (Blueprint $table): void {
                $table->foreignId('meeting_schedule_id')
                    ->nullable()
                    ->after('meeting_id')
                    ->constrained('meeting_schedule')
                    ->nullOnDelete();
            });
        }

        DB::table('meeting_attendees')
            ->orderBy('id')
            ->get(['id', 'meeting_id'])
            ->each(function (object $attendance): void {
                if (! isset($attendance->meeting_id) || $attendance->meeting_id === null) {
                    return;
                }

                $scheduleId = DB::table('meeting_schedule')
                    ->where('meeting_id', (int) $attendance->meeting_id)
                    ->orderBy('date')
                    ->orderBy('start_time')
                    ->value('id');

                if ($scheduleId === null) {
                    return;
                }

                DB::table('meeting_attendees')
                    ->where('id', (int) $attendance->id)
                    ->update([
                        'meeting_schedule_id' => (int) $scheduleId,
                    ]);
            });

        Schema::table('meeting_attendees', function (Blueprint $table): void {
            // Keep a standalone index for the meeting_id FK before replacing the old unique key.
            $table->index('meeting_id', 'meeting_attendees_meeting_id_index');
            $table->dropUnique(['meeting_id', 'user_id']);
            $table->unique(['meeting_schedule_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('meeting_attendees', function (Blueprint $table): void {
            $table->dropUnique(['meeting_schedule_id', 'user_id']);
            $table->dropConstrainedForeignId('meeting_schedule_id');
            $table->unique(['meeting_id', 'user_id']);
        });
    }
};

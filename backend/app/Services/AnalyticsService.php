<?php

namespace App\Services;

use App\Models\Blog;
use App\Models\Conversation;
use App\Models\ConversationMember;
use App\Models\Document;
use App\Models\MeetingSchedule;
use App\Models\Message;
use App\Models\Role;
use App\Models\TutorAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AnalyticsService
{
    public function getForUser(User $user): array
    {
        if ($user->hasRole(Role::STUDENT)) {
            return $this->buildStudentPayload($user);
        }

        if ($user->hasRole(Role::TUTOR)) {
            return $this->buildTutorPayload($user);
        }

        return $this->buildStaffPayload($user);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildStudentPayload(User $user): array
    {
        $upcomingQuery = $this->upcomingMeetingSchedulesForStudentQuery($user);
        $currentAssignment = $this->currentTutorAssignmentForStudent($user);

        $upcomingMeetings = $this->formatUpcomingMeetings(
            (clone $upcomingQuery)
                ->with('meeting:id,title,platform')
                ->orderBy('meeting_schedule.date')
                ->orderBy('meeting_schedule.start_time')
                ->limit(5)
                ->get()
        );

        return [
            'lastSevenDaysMessage' => $this->lastSevenDaysMessageCount($user),
            'meetingSchedules' => (clone $upcomingQuery)->count(),
            'documentShares' => $this->documentSharesCount($user),
            'lastLoginAt' => $this->formatLastLoginAt($user),
            'lastActiveAt' => $this->formatLastActiveAt($user),
            'personalTutor' => $this->formatPersonalTutor($currentAssignment),
            'upcomingMeetings' => $upcomingMeetings,
            'latestBlogs' => $this->latestBlogs(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildTutorPayload(User $user): array
    {
        $assignments = $this->applyActiveTutorAssignmentScope(
            TutorAssignment::query()->where('tutor_user_id', (int) $user->id)
        )
            ->with('student:id,uuid,name')
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->get();

        $messagesLast7Days = $this->messagesLast7DaysForTutor($user);
        $studentDashboardRows = $this->buildTutorStudentRows((int) $user->id, $assignments);
        $weeklyMeetings = $this->thisWeeksMeetingsForTutor($user);

        return [
            'lastLoginAt' => $this->formatLastLoginAt($user),
            'displayName' => $user->name,
            'welcomeSubtitle' => 'Your students requiring attention today.',
            'totalTutees' => count($studentDashboardRows),
            'messagesLast7Days' => $messagesLast7Days,
            'noInteractionStudents7PlusDays' => $this->countStudentsByInactivityDays($studentDashboardRows, 7),
            'noInteractionStudents28PlusDays' => $this->countStudentsByInactivityDays($studentDashboardRows, 28),
            'myStudents' => $studentDashboardRows,
            'thisWeeksMeetingsCount' => $weeklyMeetings['count'],
            'thisWeeksMeetings' => $weeklyMeetings['items'],
            'latestBlogs' => $this->latestBlogs(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildStaffPayload(User $user): array
    {
        $studentInteractions = $this->staffStudentInteractions();

        return [
            'lastLoginAt' => $this->formatLastLoginAt($user),
            'displayName' => $user->name,
            'welcomeSubtitle' => 'System reports and monitoring tools are available in your dashboard.',
            'totalStudents' => $this->countUsersByRole(Role::STUDENT),
            'studentsWithoutTutor' => $this->studentsWithoutTutorCount(),
            'noInteractionStudents7PlusDays' => $this->countStudentInactivity($studentInteractions, 7),
            'noInteractionStudents28PlusDays' => $this->countStudentInactivity($studentInteractions, 28),
            'messageByTutorLast7Days' => $this->messageByTutorLast7Days(),
            'tuteesPerTutor' => $this->tuteesPerTutor(),
            'mostActiveUsers' => $this->mostActiveUsers(),
            'recentAllocations' => $this->recentAllocations(),
            'latestBlogs' => $this->latestBlogs(),
        ];
    }

    /**
     * Top 5 users for staff dashboard: highest login count first, then messages sent.
     *
     * @return list<array<string, mixed>>
     */
    private function mostActiveUsers(): array
    {
        $limit = 5;

        $messageCounts = Message::query()
            ->selectRaw('sender_user_id as user_id')
            ->selectRaw('COUNT(*) as cnt')
            ->groupBy('sender_user_id')
            ->pluck('cnt', 'user_id');

        $loginCounts = $this->loginCountsByUserId();

        $users = User::query()
            ->with('role:id,code,name')
            ->whereHas('role', function (Builder $query): void {
                $query->whereIn('code', Role::CODES);
            })
            ->get(['id', 'uuid', 'name', 'role_id']);

        $ranked = $users
            ->map(function (User $u) use ($messageCounts, $loginCounts): array {
                $id = (int) $u->id;
                $messages = (int) ($messageCounts[$id] ?? 0);
                $logins = (int) ($loginCounts[$id] ?? 0);

                return [
                    'user' => $u,
                    'loginCount' => $logins,
                    'messagesSent' => $messages,
                ];
            })
            ->sort(function (array $a, array $b): int {
                if ($a['loginCount'] !== $b['loginCount']) {
                    return $b['loginCount'] <=> $a['loginCount'];
                }

                return $b['messagesSent'] <=> $a['messagesSent'];
            })
            ->values();

        $top = $ranked->take($limit);

        return $top
            ->map(function (array $row): array {
                /** @var User $u */
                $u = $row['user'];
                $roleName = $u->role?->name;
                if (! is_string($roleName) || $roleName === '') {
                    $roleName = $u->role?->code ?? 'Unknown';
                }

                return [
                    'userId' => (int) $u->id,
                    'userUuid' => $u->uuid,
                    'userName' => $u->name,
                    'role' => $roleName,
                    'loginCount' => (int) $row['loginCount'],
                    'messagesSent' => (int) $row['messagesSent'],
                    'lastActive' => $this->formatLastActiveAt($u),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, int> user id => login count
     */
    private function loginCountsByUserId(): array
    {
        $activityTableName = (string) config('activitylog.table_name', 'activity_log');

        if ($activityTableName === '' || ! Schema::hasTable($activityTableName)) {
            return [];
        }

        $rows = DB::table($activityTableName)
            ->where('description', 'auth.login')
            ->where(function ($query): void {
                $query
                    ->where(function ($q): void {
                        $q->where('target_type', User::class)->whereNotNull('target_id');
                    })
                    ->orWhere(function ($q): void {
                        $q->where('actor_type', User::class)->whereNotNull('actor_id');
                    });
            })
            ->selectRaw('COALESCE(target_id, actor_id) as user_id')
            ->selectRaw('COUNT(*) as cnt')
            ->groupBy(DB::raw('COALESCE(target_id, actor_id)'))
            ->get();

        $out = [];
        foreach ($rows as $row) {
            if (! isset($row->user_id) || $row->user_id === null) {
                continue;
            }
            $out[(int) $row->user_id] = (int) $row->cnt;
        }

        return $out;
    }

    private function lastSevenDaysMessageCount(User $user): int
    {
        return Message::query()
            ->where('sender_user_id', (int) $user->id)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();
    }

    private function documentSharesCount(User $user): int
    {
        return Document::query()
            ->where('uploaded_by_user_id', (int) $user->id)
            ->count();
    }

    private function countUsersByRole(string $roleCode): int
    {
        return User::query()
            ->whereHas('role', function (Builder $query) use ($roleCode): void {
                $query->where('code', $roleCode);
            })
            ->count();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function latestBlogs(): array
    {
        return Blog::query()
            ->where('is_active', true)
            ->with(['author:id,uuid,name,role_id', 'author.role:id,code'])
            ->withCount('comments')
            ->latest('id')
            ->limit(2)
            ->get()
            ->map(function (Blog $blog): array {
                /** @var array<int, string>|mixed $tags */
                $tags = $blog->hashtags;
                $coverImagePath = $blog->cover_image_path;

                return [
                    'id' => (int) $blog->id,
                    'title' => $blog->title,
                    'description' => Str::limit(Str::squish(strip_tags((string) $blog->content)), 160),
                    'tags' => is_array($tags) ? array_values($tags) : [],
                    'coverImageUrl' => $coverImagePath !== null ? Storage::disk('public')->url($coverImagePath) : null,
                    'viewCount' => (int) $blog->view_count,
                    'commentCount' => (int) ($blog->comments_count ?? 0),
                    'created_at' => $blog->created_at?->toISOString(),
                    'author' => $blog->author === null ? null : [
                        'id' => (int) $blog->author->id,
                        'uuid' => $blog->author->uuid,
                        'name' => $blog->author->name,
                        'role_code' => $blog->author->role?->code,
                    ],
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, MeetingSchedule>  $schedules
     * @return list<array<string, mixed>>
     */
    private function formatUpcomingMeetings(Collection $schedules): array
    {
        return $schedules
            ->map(function (MeetingSchedule $schedule): array {
                $meeting = $schedule->meeting;

                return [
                    'id' => $meeting?->id ?? $schedule->meeting_id,
                    'title' => $meeting?->title,
                    'date' => (string) $schedule->date,
                    'from' => $this->trimTime((string) $schedule->start_time),
                    'to' => $this->trimTime((string) $schedule->end_time),
                    'platform' => $meeting?->platform,
                ];
            })
            ->values()
            ->all();
    }

    private function trimTime(string $value): string
    {
        return strlen($value) >= 5 ? substr($value, 0, 5) : $value;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function formatPersonalTutor(?TutorAssignment $assignment): ?array
    {
        $tutor = $assignment?->tutor;

        if ($assignment === null || $tutor === null) {
            return null;
        }

        return [
            'id' => (int) $tutor->id,
            'uuid' => $tutor->uuid,
            'name' => $tutor->name,
            'headline' => $tutor->subjects->first()?->name,
            'email' => $tutor->email,
            'phone' => $tutor->phone,
            'is_active' => (bool) $tutor->is_active,
            'avatar' => [
                'url' => null,
                'initials' => $this->extractInitials($tutor->name),
            ],
            'subjects' => $tutor->subjects->pluck('name')->values()->all(),
            'assignment' => [
                'id' => (int) $assignment->id,
                'from' => $assignment->start_date,
                'to' => $assignment->end_date,
                'status' => $assignment->status,
            ],
        ];
    }

    private function currentTutorAssignmentForStudent(User $user): ?TutorAssignment
    {
        return $this->applyActiveTutorAssignmentScope(
            TutorAssignment::query()
                ->with(['tutor:id,uuid,name,email,phone,is_active', 'tutor.subjects:id,name'])
                ->where('student_user_id', (int) $user->id)
        )
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->first();
    }

    private function applyActiveTutorAssignmentScope(Builder $query): Builder
    {
        $today = now()->toDateString();

        return $query->where(function (Builder $builder) use ($today): void {
            $builder
                ->where('status', TutorAssignment::STATUS_ACTIVE)
                ->orWhere(function (Builder $dateQuery) use ($today): void {
                    $dateQuery
                        ->whereDate('start_date', '<=', $today)
                        ->whereDate('end_date', '>=', $today);
                });
        });
    }

    private function upcomingMeetingSchedulesForStudentQuery(User $user): Builder
    {
        $query = MeetingSchedule::query()
            ->select('meeting_schedule.*')
            ->join('meeting', 'meeting.id', '=', 'meeting_schedule.meeting_id')
            ->join('tutor_assignments', 'tutor_assignments.id', '=', 'meeting.tutor_assignment_id')
            ->where('tutor_assignments.student_user_id', (int) $user->id)
            ->whereNull('meeting_schedule.cancel_at');

        return $this->applyUpcomingMeetingScope($query);
    }

    private function upcomingMeetingSchedulesForTutorQuery(User $user): Builder
    {
        $query = MeetingSchedule::query()
            ->select('meeting_schedule.*')
            ->join('meeting', 'meeting.id', '=', 'meeting_schedule.meeting_id')
            ->join('tutor_assignments', 'tutor_assignments.id', '=', 'meeting.tutor_assignment_id')
            ->where('tutor_assignments.tutor_user_id', (int) $user->id)
            ->whereNull('meeting_schedule.cancel_at');

        return $this->applyUpcomingMeetingScope($query);
    }

    private function upcomingMeetingSchedulesGlobalQuery(): Builder
    {
        $query = MeetingSchedule::query()
            ->select('meeting_schedule.*')
            ->join('meeting', 'meeting.id', '=', 'meeting_schedule.meeting_id')
            ->whereNull('meeting_schedule.cancel_at');

        return $this->applyUpcomingMeetingScope($query);
    }

    private function applyUpcomingMeetingScope(Builder $query): Builder
    {
        $today = now()->toDateString();
        $currentTime = now()->format('H:i:s');

        return $query->where(function (Builder $builder) use ($today, $currentTime): void {
            $builder
                ->whereDate('meeting_schedule.date', '>', $today)
                ->orWhere(function (Builder $sameDayBuilder) use ($today, $currentTime): void {
                    $sameDayBuilder
                        ->whereDate('meeting_schedule.date', '=', $today)
                        ->whereTime('meeting_schedule.start_time', '>=', $currentTime);
                });
        });
    }

    private function formatLastActiveAt(User $user): string
    {
        $activityTimestamp = null;
        $activityTableName = (string) config('activitylog.table_name', 'activity_log');

        if ($activityTableName !== '' && Schema::hasTable($activityTableName)) {
            $activityTimestamp = DB::table($activityTableName)
                ->where('actor_type', User::class)
                ->where('actor_id', (int) $user->id)
                ->max('created_at');
        }

        $latest = collect([
            $activityTimestamp,
            Message::query()
                ->where('sender_user_id', (int) $user->id)
                ->max('created_at'),
            Document::query()
                ->where('uploaded_by_user_id', (int) $user->id)
                ->max('created_at'),
            ConversationMember::query()
                ->where('user_id', (int) $user->id)
                ->max('last_seen_at'),
            $user->updated_at,
            $user->created_at,
        ])
            ->filter()
            ->map(static function (mixed $value): Carbon {
                if ($value instanceof Carbon) {
                    return $value;
                }

                return Carbon::parse((string) $value);
            })
            ->sortDesc()
            ->first();

        return ($latest ?? now())->toIso8601String();
    }

    private function formatLastLoginAt(User $user): ?string
    {
        $activityTableName = (string) config('activitylog.table_name', 'activity_log');
        $loginActivityTimestamp = null;

        if ($activityTableName !== '' && Schema::hasTable($activityTableName)) {
            $loginActivityTimestamp = DB::table($activityTableName)
                ->where('actor_type', User::class)
                ->where('actor_id', (int) $user->id)
                ->where('description', 'auth.login')
                ->max('created_at');
        }

        if ($loginActivityTimestamp === null && Schema::hasTable('personal_access_tokens')) {
            $loginActivityTimestamp = DB::table('personal_access_tokens')
                ->where('tokenable_type', User::class)
                ->where('tokenable_id', (int) $user->id)
                ->max('created_at');
        }

        if ($loginActivityTimestamp === null) {
            return null;
        }

        return Carbon::parse((string) $loginActivityTimestamp)->toIso8601String();
    }

    private function extractInitials(string $name): string
    {
        $words = preg_split('/\s+/', trim($name)) ?: [];

        $letters = collect($words)
            ->filter()
            ->take(2)
            ->map(static fn (string $word): string => strtoupper(substr($word, 0, 1)))
            ->implode('');

        return $letters !== '' ? $letters : 'NA';
    }

    /**
     * @return list<array{studentId:int, lastInteractionIso:string|null}>
     */
    private function staffStudentInteractions(): array
    {
        $students = User::query()
            ->select('users.id')
            ->whereHas('role', function (Builder $query): void {
                $query->where('code', Role::STUDENT);
            })
            ->get();

        return $students
            ->map(function (User $student): array {
                return [
                    'studentId' => (int) $student->id,
                    'lastInteractionIso' => $this->resolveUserInteractionIso((int) $student->id),
                ];
            })
            ->values()
            ->all();
    }

    private function resolveUserInteractionIso(int $userId): ?string
    {
        $activityTimestamp = null;
        $activityTableName = (string) config('activitylog.table_name', 'activity_log');

        if ($activityTableName !== '' && Schema::hasTable($activityTableName)) {
            $activityTimestamp = DB::table($activityTableName)
                ->where('actor_type', User::class)
                ->where('actor_id', $userId)
                ->max('created_at');
        }

        $latest = collect([
            $activityTimestamp,
            Message::query()->where('sender_user_id', $userId)->max('created_at'),
            Document::query()->where('uploaded_by_user_id', $userId)->max('created_at'),
            ConversationMember::query()->where('user_id', $userId)->max('last_seen_at'),
        ])
            ->filter()
            ->map(static function (mixed $value): Carbon {
                if ($value instanceof Carbon) {
                    return $value;
                }

                return Carbon::parse((string) $value);
            })
            ->sortDesc()
            ->first();

        return $latest?->toISOString();
    }

    /**
     * @param  list<array{studentId:int, lastInteractionIso:string|null}>  $rows
     */
    private function countStudentInactivity(array $rows, int $thresholdDays): int
    {
        return collect($rows)
            ->filter(function (array $row) use ($thresholdDays): bool {
                $lastInteractionIso = $row['lastInteractionIso'];
                if (! is_string($lastInteractionIso) || $lastInteractionIso === '') {
                    return true;
                }

                return Carbon::parse($lastInteractionIso)->diffInDays(now()) >= $thresholdDays;
            })
            ->count();
    }

    private function studentsWithoutTutorCount(): int
    {
        $assignedStudentIds = $this->applyActiveTutorAssignmentScope(
            TutorAssignment::query()->whereNotNull('student_user_id')
        )
            ->distinct()
            ->pluck('student_user_id')
            ->filter()
            ->map(static fn (mixed $id): int => (int) $id)
            ->values()
            ->all();

        return User::query()
            ->whereHas('role', function (Builder $query): void {
                $query->where('code', Role::STUDENT);
            })
            ->when($assignedStudentIds !== [], function (Builder $query) use ($assignedStudentIds): void {
                $query->whereNotIn('id', $assignedStudentIds);
            })
            ->count();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function messageByTutorLast7Days(): array
    {
        $rows = Message::query()
            ->select([
                'users.id as tutor_id',
                'users.uuid as tutor_uuid',
                'users.name as tutor_name',
                DB::raw('COUNT(messages.id) as message_count'),
            ])
            ->join('users', 'users.id', '=', 'messages.sender_user_id')
            ->join('roles', 'roles.id', '=', 'users.role_id')
            ->where('roles.code', Role::TUTOR)
            ->where('messages.created_at', '>=', now()->subDays(7))
            ->groupBy('users.id', 'users.uuid', 'users.name')
            ->orderByDesc('message_count')
            ->orderBy('users.name')
            ->limit(5)
            ->get();

        return $rows
            ->map(static function (object $row): array {
                return [
                    'tutorId' => (int) $row->tutor_id,
                    'tutorUuid' => $row->tutor_uuid,
                    'tutorName' => $row->tutor_name,
                    'messagesCount' => (int) $row->message_count,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function tuteesPerTutor(): array
    {
        $rows = $this->applyActiveTutorAssignmentScope(
            TutorAssignment::query()
                ->select([
                    'users.id as tutor_id',
                    'users.uuid as tutor_uuid',
                    'users.name as tutor_name',
                    DB::raw('COUNT(DISTINCT tutor_assignments.student_user_id) as tutees_count'),
                ])
                ->join('users', 'users.id', '=', 'tutor_assignments.tutor_user_id')
                ->whereNotNull('tutor_assignments.student_user_id')
                ->groupBy('users.id', 'users.uuid', 'users.name')
        )
            ->orderByDesc('tutees_count')
            ->orderBy('users.name')
            ->limit(5)
            ->get();

        return $rows
            ->map(static function (object $row): array {
                return [
                    'tutorId' => (int) $row->tutor_id,
                    'tutorUuid' => $row->tutor_uuid,
                    'tutorName' => $row->tutor_name,
                    'tuteesCount' => (int) $row->tutees_count,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentAllocations(): array
    {
        $rows = $this->applyActiveTutorAssignmentScope(
            TutorAssignment::query()
                ->with([
                    'tutor:id,uuid,name',
                    'student:id,uuid,name',
                ])
                ->orderByDesc('created_at')
                ->orderByDesc('id')
        )
            ->limit(5)
            ->get();

        return $rows
            ->map(static function (TutorAssignment $assignment): array {
                return [
                    'allocationId' => (int) $assignment->id,
                    'tutor' => $assignment->tutor === null ? null : [
                        'id' => (int) $assignment->tutor->id,
                        'uuid' => $assignment->tutor->uuid,
                        'name' => $assignment->tutor->name,
                    ],
                    'student' => $assignment->student === null ? null : [
                        'id' => (int) $assignment->student->id,
                        'uuid' => $assignment->student->uuid,
                        'name' => $assignment->student->name,
                    ],
                    'semesterPeriod' => [
                        'from' => $assignment->start_date,
                        'to' => $assignment->end_date,
                        'label' => $assignment->start_date.' - '.$assignment->end_date,
                    ],
                    'status' => $assignment->status,
                ];
            })
            ->values()
            ->all();
    }

    private function messagesLast7DaysForTutor(User $user): int
    {
        return Message::query()
            ->where('created_at', '>=', now()->subDays(7))
            ->whereExists(function ($query) use ($user): void {
                $query->selectRaw('1')
                    ->from('conversation_members')
                    ->whereColumn('conversation_members.conversation_id', 'messages.conversation_id')
                    ->where('conversation_members.user_id', (int) $user->id);
            })
            ->count();
    }

    /**
     * @param  Collection<int, TutorAssignment>  $assignments
     * @return list<array<string, mixed>>
     */
    private function buildTutorStudentRows(int $tutorUserId, Collection $assignments): array
    {
        return $assignments
            ->map(function (TutorAssignment $assignment) use ($tutorUserId): array {
                $student = $assignment->student;
                $interaction = $student !== null
                    ? $this->resolveTutorStudentInteraction($tutorUserId, (int) $student->id)
                    : ['conversationId' => null, 'lastInteractionAt' => null, 'lastInteractionIso' => null];

                return [
                    'studentId' => $student?->id,
                    'studentUuid' => $student?->uuid,
                    'studentName' => $student?->name,
                    'semesterPeriod' => [
                        'from' => $assignment->start_date,
                        'to' => $assignment->end_date,
                        'label' => $assignment->start_date.' - '.$assignment->end_date,
                    ],
                    'lastInteractionAt' => $interaction['lastInteractionAt'],
                    'lastInteractionIso' => $interaction['lastInteractionIso'],
                    'conversationId' => $interaction['conversationId'],
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array{conversationId: int|null, lastInteractionAt: string|null, lastInteractionIso: string|null}
     */
    private function resolveTutorStudentInteraction(int $tutorUserId, int $studentUserId): array
    {
        $conversationId = DB::table('conversation_members as tutor_member')
            ->join('conversation_members as student_member', function ($join): void {
                $join
                    ->on('student_member.conversation_id', '=', 'tutor_member.conversation_id')
                    ->whereNull('student_member.deleted_at');
            })
            ->join('conversations', function ($join): void {
                $join
                    ->on('conversations.id', '=', 'tutor_member.conversation_id')
                    ->whereNull('conversations.deleted_at');
            })
            ->whereNull('tutor_member.deleted_at')
            ->where('tutor_member.user_id', $tutorUserId)
            ->where('student_member.user_id', $studentUserId)
            ->orderByDesc(DB::raw('COALESCE(conversations.last_message_at, conversations.updated_at, conversations.created_at)'))
            ->orderByDesc('conversations.id')
            ->value('conversations.id');

        if ($conversationId === null) {
            return [
                'conversationId' => null,
                'lastInteractionAt' => null,
                'lastInteractionIso' => null,
            ];
        }

        $latestInteraction = collect([
            Conversation::query()->whereKey($conversationId)->value('last_message_at'),
            Message::query()->where('conversation_id', (int) $conversationId)->max('created_at'),
            Document::query()->where('conversation_id', (int) $conversationId)->max('created_at'),
        ])
            ->filter()
            ->map(static function (mixed $value): Carbon {
                if ($value instanceof Carbon) {
                    return $value;
                }

                return Carbon::parse((string) $value);
            })
            ->sortDesc()
            ->first();

        return [
            'conversationId' => (int) $conversationId,
            'lastInteractionAt' => $latestInteraction?->format('Y/m/d'),
            'lastInteractionIso' => $latestInteraction?->toISOString(),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    private function countStudentsByInactivityDays(array $rows, int $thresholdDays): int
    {
        return collect($rows)
            ->filter(function (array $row) use ($thresholdDays): bool {
                $lastInteractionIso = $row['lastInteractionIso'] ?? null;
                if (! is_string($lastInteractionIso) || $lastInteractionIso === '') {
                    return true;
                }

                return Carbon::parse($lastInteractionIso)->diffInDays(now()) >= $thresholdDays;
            })
            ->count();
    }

    /**
     * @return array{count: int, items: list<array<string, mixed>>}
     */
    private function thisWeeksMeetingsForTutor(User $user): array
    {
        $weekStart = now()->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
        $weekEnd = now()->copy()->endOfWeek(Carbon::MONDAY)->toDateString();

        $query = MeetingSchedule::query()
            ->select([
                'meeting_schedule.*',
                'meeting.id as meeting_item_id',
                'meeting.title as meeting_title',
                'meeting.platform as meeting_platform',
                'tutor_assignments.student_user_id as student_id',
                'students.name as student_name',
            ])
            ->join('meeting', 'meeting.id', '=', 'meeting_schedule.meeting_id')
            ->join('tutor_assignments', 'tutor_assignments.id', '=', 'meeting.tutor_assignment_id')
            ->leftJoin('users as students', 'students.id', '=', 'tutor_assignments.student_user_id')
            ->where('tutor_assignments.tutor_user_id', (int) $user->id)
            ->whereNull('meeting_schedule.cancel_at')
            ->whereBetween('meeting_schedule.date', [$weekStart, $weekEnd]);

        $query = $this->applyUpcomingMeetingScope($query);
        $count = (clone $query)->count();

        $items = (clone $query)
            ->orderBy('meeting_schedule.date')
            ->orderBy('meeting_schedule.start_time')
            ->limit(5)
            ->get()
            ->map(static function (MeetingSchedule $schedule): array {
                return [
                    'meetingId' => (int) ($schedule->meeting_item_id ?? $schedule->meeting_id),
                    'scheduleId' => (int) $schedule->id,
                    'title' => (string) ($schedule->meeting_title ?? ''),
                    'studentId' => $schedule->student_id === null ? null : (int) $schedule->student_id,
                    'studentName' => $schedule->student_name,
                    'date' => (string) $schedule->date,
                    'from' => strlen((string) $schedule->start_time) >= 5 ? substr((string) $schedule->start_time, 0, 5) : (string) $schedule->start_time,
                    'to' => strlen((string) $schedule->end_time) >= 5 ? substr((string) $schedule->end_time, 0, 5) : (string) $schedule->end_time,
                    'platform' => $schedule->meeting_platform,
                    'status' => 'UPCOMING',
                ];
            })
            ->values()
            ->all();

        return [
            'count' => $count,
            'items' => $items,
        ];
    }
}

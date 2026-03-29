<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Services\AnalyticsService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Analytics', description: 'Role-based analytics data for dashboard views.', weight: 12)]
class AnalyticsController
{
    public function __construct(
        private readonly AnalyticsService $analyticsService
    ) {}

    #[Endpoint(
        operationId: 'getAnalytics',
        title: 'Get Analytics',
        description: 'Returns dashboard analytics based on the authenticated user role.'
    )]
    #[Response(
        status: 200,
        description: 'Role-based analytics payload.',
        examples: [
            // Student dashboard payload
            [
                'lastSevenDaysMessage' => 10,
                'meetingSchedules' => 1,
                'documentShares' => 5,
                'lastLoginAt' => '2026-03-22T08:10:00+00:00',
                'lastActiveAt' => '2026-03-22T14:30:00+00:00',
                'personalTutor' => [
                    'id' => 9,
                    'uuid' => '7cf7fd7d-6be0-4988-b0d8-9f6deff44b95',
                    'name' => 'Tutor User',
                    'headline' => 'Software Engineering',
                    'email' => 'tutor@greenwich.ac.uk',
                    'phone' => null,
                    'is_active' => true,
                    'avatar' => [
                        'url' => null,
                        'initials' => 'TU',
                    ],
                    'subjects' => ['Software Engineering', 'Algorithms'],
                    'assignment' => [
                        'id' => 12,
                        'from' => '2026-03-01',
                        'to' => '2026-06-30',
                        'status' => 'ACTIVE',
                    ],
                ],
                'upcomingMeetings' => [
                    [
                        'id' => 1,
                        'title' => 'Course work preview',
                        'date' => '2026-03-24',
                        'from' => '10:00',
                        'to' => '10:40',
                        'platform' => 'Google Meet',
                    ],
                ],
                'latestBlogs' => [
                    [
                        'id' => 1,
                        'title' => 'Study Routine for Busy Weeks',
                        'description' => 'A simple routine to stay on top of revision during a packed schedule.',
                        'tags' => ['study', 'routine', 'productivity'],
                        'coverImageUrl' => 'https://example.test/storage/blog-covers/cover.jpg',
                        'viewCount' => 120,
                        'commentCount' => 8,
                        'created_at' => '2026-03-22T05:00:00.000000Z',
                        'author' => [
                            'id' => 4,
                            'uuid' => 'ebbe4f9b-bdc1-471f-b7f9-feb4f8b6138c',
                            'name' => 'Staff User',
                            'role_code' => 'STAFF',
                        ],
                    ],
                ],
            ],
            // Tutor dashboard payload
            [
                'lastLoginAt' => '2026-03-22T08:10:00+00:00',
                'displayName' => 'Dr. Andrew Collins',
                'welcomeSubtitle' => 'Your students requiring attention today.',
                'totalTutees' => 3,
                'messagesLast7Days' => 1,
                'noInteractionStudents7PlusDays' => 2,
                'noInteractionStudents28PlusDays' => 4,
                'myStudents' => [
                    [
                        'studentId' => 22,
                        'studentUuid' => 'f2f4fc74-b9df-4a5d-8f94-3e6aa66b62bf',
                        'studentName' => 'Aiden Murphy',
                        'semesterPeriod' => [
                            'from' => '2026-01-15',
                            'to' => '2026-05-15',
                            'label' => '2026-01-15 - 2026-05-15',
                        ],
                        'lastInteractionAt' => '2026/02/12',
                        'lastInteractionIso' => '2026-02-12T00:00:00.000000Z',
                        'conversationId' => 55,
                    ],
                ],
                'thisWeeksMeetingsCount' => 8,
                'thisWeeksMeetings' => [
                    [
                        'meetingId' => 301,
                        'scheduleId' => 9901,
                        'title' => 'Coursework Progress Review',
                        'studentId' => 22,
                        'studentName' => 'Aiden Murphy',
                        'date' => '2026-03-10',
                        'from' => '10:00',
                        'to' => '10:30',
                        'platform' => 'Zoom',
                        'status' => 'UPCOMING',
                    ],
                ],
                'latestBlogs' => [
                    [
                        'id' => 1,
                        'title' => 'Study Routine for Busy Weeks',
                        'description' => 'A simple routine to stay on top of revision during a packed schedule.',
                        'tags' => ['study', 'routine', 'productivity'],
                        'coverImageUrl' => 'https://example.test/storage/blog-covers/cover.jpg',
                        'viewCount' => 120,
                        'commentCount' => 8,
                        'created_at' => '2026-03-22T05:00:00.000000Z',
                        'author' => [
                            'id' => 4,
                            'uuid' => 'ebbe4f9b-bdc1-471f-b7f9-feb4f8b6138c',
                            'name' => 'Staff User',
                            'role_code' => 'STAFF',
                        ],
                    ],
                ],
            ],
            // Staff/Admin dashboard payload
            [
                'lastLoginAt' => '2026-03-22T08:10:00+00:00',
                'displayName' => 'Admin User',
                'welcomeSubtitle' => 'System reports and monitoring tools are available in your dashboard.',
                'totalStudents' => 32,
                'studentsWithoutTutor' => 3,
                'noInteractionStudents7PlusDays' => 4,
                'noInteractionStudents28PlusDays' => 1,
                'messageByTutorLast7Days' => [
                    [
                        'tutorId' => 9,
                        'tutorUuid' => '07d6833f-8f35-45c4-bf1e-31ce8f6ea193',
                        'tutorName' => 'Dr. Michael Grant',
                        'messagesCount' => 70,
                    ],
                ],
                'tuteesPerTutor' => [
                    [
                        'tutorId' => 9,
                        'tutorUuid' => '07d6833f-8f35-45c4-bf1e-31ce8f6ea193',
                        'tutorName' => 'Dr. Michael Grant',
                        'tuteesCount' => 18,
                    ],
                ],
                'mostActiveUsers' => [
                    [
                        'userId' => 12,
                        'userUuid' => 'f2f4fc74-b9df-4a5d-8f94-3e6aa66b62bf',
                        'userName' => 'Aiden Murphy',
                        'role' => 'Student',
                        'loginCount' => 32,
                        'messagesSent' => 12,
                        'lastActive' => '2026/03/22 14:30',
                    ],
                ],
                'recentAllocations' => [
                    [
                        'allocationId' => 88,
                        'tutor' => [
                            'id' => 9,
                            'uuid' => '07d6833f-8f35-45c4-bf1e-31ce8f6ea193',
                            'name' => 'Dr. Michael Grant',
                        ],
                        'student' => [
                            'id' => 22,
                            'uuid' => 'f2f4fc74-b9df-4a5d-8f94-3e6aa66b62bf',
                            'name' => 'Aiden Murphy',
                        ],
                        'semesterPeriod' => [
                            'from' => '2026-01-15',
                            'to' => '2026-05-15',
                            'label' => '2026-01-15 - 2026-05-15',
                        ],
                        'status' => 'ACTIVE',
                    ],
                ],
                'mostViewedPages' => [
                    ['name' => 'Dashboard', 'views' => 120],
                    ['name' => 'Staff', 'views' => 45],
                ],
                'browsersUsed' => [
                    ['name' => 'Chrome', 'value' => 100],
                    ['name' => 'Safari', 'value' => 40],
                ],
                'latestBlogs' => [
                    [
                        'id' => 1,
                        'title' => 'Study Routine for Busy Weeks',
                        'description' => 'A simple routine to stay on top of revision during a packed schedule.',
                        'tags' => ['study', 'routine', 'productivity'],
                        'coverImageUrl' => 'https://example.test/storage/blog-covers/cover.jpg',
                        'viewCount' => 120,
                        'commentCount' => 8,
                        'created_at' => '2026-03-22T05:00:00.000000Z',
                        'author' => [
                            'id' => 4,
                            'uuid' => 'ebbe4f9b-bdc1-471f-b7f9-feb4f8b6138c',
                            'name' => 'Staff User',
                            'role_code' => 'STAFF',
                        ],
                    ],
                ],
            ],
        ],
    )]
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        abort_if(! $user instanceof User, 401, 'Unauthenticated.');

        return response()
            ->json($this->analyticsService->getForUser($user))
            ->header('Cache-Control', 'no-store, private');
    }
}

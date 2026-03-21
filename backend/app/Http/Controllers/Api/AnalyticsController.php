<?php

namespace App\Http\Controllers\Api;

use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;

#[Group('Analytics', description: 'Mock analytics data for dashboard views.', weight: 12)]
class AnalyticsController
{
    #[Endpoint(
        operationId: 'getAnalytics',
        title: 'Get Analytics',
        description: 'Returns mock analytics data for the dashboard.'
    )]
    #[Response(
        status: 200,
        description: 'Mock analytics payload.',
        examples: [
            [
                'lastSevenDaysMessage' => 10,
                'meetingSchedules' => 1,
                'documentShares' => 5,
                'lastActiveAt' => '2026/03/22 14:30',
                'personalTutor' => [
                    'image' => [
                        'width' => 100,
                        'height' => 100,
                        'url' => 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg',
                    ],
                ],
                'upcomingMeeting' => [
                    'id' => 1,
                    'title' => 'Course work preview',
                    'date' => '2026-03-24',
                    'from' => '10:00',
                    'to' => '10:40',
                    'platform' => 'Google Meet',
                ],
                'lastblogs' => [
                    [
                        'id' => 1,
                        'title' => 'Study Routine for Busy Weeks',
                        'description' => 'A simple routine to stay on top of revision during a packed schedule.',
                        'tags' => ['study', 'routine', 'productivity'],
                    ],
                    [
                        'id' => 2,
                        'title' => 'How to Review Notes Effectively',
                        'description' => 'A practical method for turning class notes into weekly revision material.',
                        'tags' => ['study', 'notes', 'revision'],
                    ],
                ],
            ],
        ],
    )]
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'lastSevenDaysMessage' => 10,
            'meetingSchedules' => 1,
            'documentShares' => 5,
            'lastActiveAt' => now()->subHours(2)->format('Y/m/d H:i'),
            'personalTutor' => [
                'image' => [
                    'width' => 100,
                    'height' => 100,
                    'url' => 'https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg',
                ],
            ],
            'upcomingMeeting' => [
                'id' => 1,
                'title' => 'Course work preview',
                'date' => now()->addDays(2)->format('Y-m-d'),
                'from' => '10:00',
                'to' => '10:40',
                'platform' => 'Google Meet',
            ],
            'lastblogs' => [
                [
                    'id' => 1,
                    'title' => 'Study Routine for Busy Weeks',
                    'description' => 'A simple routine to stay on top of revision during a packed schedule.',
                    'tags' => ['study', 'routine', 'productivity'],
                ],
                [
                    'id' => 2,
                    'title' => 'How to Review Notes Effectively',
                    'description' => 'A practical method for turning class notes into weekly revision material.',
                    'tags' => ['study', 'notes', 'revision'],
                ],
            ],
        ]);
    }
}

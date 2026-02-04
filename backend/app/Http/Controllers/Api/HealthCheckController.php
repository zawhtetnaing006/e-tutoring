<?php

namespace App\Http\Controllers\Api;

use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;

#[Group('Health', description: 'System health and status endpoints.', weight: 0)]
class HealthCheckController
{
    #[Endpoint(
        operationId: 'healthCheck',
        title: 'Health check',
        description: 'Lightweight endpoint for uptime checks and load balancers.'
    )]
    #[Response(
        status: 200,
        description: 'OK',
        examples: [
            [
                'status' => 'ok',
                'app' => 'Laravel',
                'timestamp' => '2026-02-04T00:00:00Z',
            ],
        ],
    )]
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'app' => config('app.name'),
            'timestamp' => now()->utc()->toIso8601String(),
        ]);
    }
}


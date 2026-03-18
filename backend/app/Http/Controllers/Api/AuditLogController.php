<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\AuditLogResource;
use App\Models\User;
use App\Traits\FormatsListingResponse;
use Carbon\CarbonImmutable;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

#[Group('Audit Logs', description: 'Audit log listing endpoints.', weight: 12)]
class AuditLogController
{
    use FormatsListingResponse;

    #[Endpoint(title: 'List Audit Logs')]
    #[QueryParameter('date_from', required: false, example: '2026-03-01')]
    #[QueryParameter('date_to', required: false, example: '2026-03-18')]
    #[QueryParameter('search', required: false, example: 'Jane Doe')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    #[Response(status: 200, examples: [[
        'data' => [[
            'id' => 101,
            'date_time' => '2026-03-18T10:30:00.000000Z',
            'actor' => 'Staff User (Staff)',
            'action' => 'UPDATE_USER',
            'target' => 'User#18',
            'description' => 'Updated User#18: email, role.',
        ]],
        'current_page' => 1,
        'total_page' => 1,
        'total_items' => 1,
    ]])]
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'string', 'max:255'],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date'],
        ]);

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $page = max(1, (int) $request->integer('page', 1));
        $search = trim((string) ($filters['search'] ?? ''));
        $dateFrom = array_key_exists('date_from', $filters)
            ? CarbonImmutable::parse((string) $filters['date_from'])->startOfDay()
            : null;
        $dateTo = array_key_exists('date_to', $filters)
            ? CarbonImmutable::parse((string) $filters['date_to'])->endOfDay()
            : null;

        $matchingActorIds = $search === ''
            ? []
            : User::query()
                ->where(function ($query) use ($search): void {
                    $query
                        ->where('name', 'like', '%' . $search . '%');
                })
                ->limit(100)
                ->pluck('id')
                ->map(static fn (mixed $id): int => (int) $id)
                ->all();

        $activities = Activity::query()
            ->inLog('audit')
            ->with([
                'causer' => function (MorphTo $morphTo): void {
                    $morphTo->morphWith([
                        User::class => ['role:id,code,name'],
                    ]);
                },
                'subject',
            ])
            ->when($dateFrom !== null, function ($query) use ($dateFrom): void {
                $query->where('created_at', '>=', $dateFrom);
            })
            ->when($dateTo !== null, function ($query) use ($dateTo): void {
                $query->where('created_at', '<=', $dateTo);
            })
            ->when($search !== '', function ($query) use ($search, $matchingActorIds): void {
                $query->where(function ($builder) use ($search, $matchingActorIds): void {
                    if ($matchingActorIds === []) {
                        $builder->whereRaw('1 = 0');

                        return;
                    }

                    $builder->where(function ($actorQuery) use ($matchingActorIds): void {
                        $actorQuery
                            ->where(function ($causerQuery) use ($matchingActorIds): void {
                                $causerQuery
                                    ->where('causer_type', User::class)
                                    ->whereIn('causer_id', $matchingActorIds);
                            })
                            ->orWhere(function ($authQuery) use ($matchingActorIds): void {
                                $authQuery
                                    ->where('description', 'like', 'auth.%')
                                    ->where('subject_type', User::class)
                                    ->whereIn('subject_id', $matchingActorIds);
                            });
                    });
                });
            })
            ->latest('created_at')
            ->latest('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $activities->getCollection()
            ->map(fn (Activity $activity): array => (new AuditLogResource($activity))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($activities, $data);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Meeting\StoreMeetingRequest;
use App\Http\Requests\Meeting\UpdateMeetingRequest;
use App\Http\Resources\MeetingResource;
use App\Models\Meeting;
use App\Traits\FormatsListingResponse;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Dedoc\Scramble\Attributes\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

#[Group('Meetings', description: 'Meeting management endpoints.', weight: 7)]
class MeetingController
{
    use FormatsListingResponse;

    #[Endpoint(title: 'List Meetings')]
    #[QueryParameter('per_page', required: false, example: 15)]
    #[QueryParameter('page', required: false, example: 1)]
    #[Response(status: 200, examples: [[
        'data' => [[
            'id' => 1,
            'title' => 'Math Session',
            'description' => 'Weekly tutoring',
            'type' => 'virtual',
            'platform' => 'Google Meet',
            'link' => 'https://meet.example.com/abc',
            'location' => null,
            'class_id' => 1,
            'meeting_schedules' => [[
                'id' => 1,
                'meeting_id' => 1,
                'date' => '2026-03-10',
                'start_time' => '09:00:00',
                'end_time' => '10:00:00',
                'note' => 'Focus on algebra practice.',
                'created_at' => '2026-03-01T00:00:00.000000Z',
                'updated_at' => '2026-03-01T00:00:00.000000Z',
            ]],
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ]],
        'current_page' => 1,
        'total_page' => 1,
        'total_items' => 1,
    ]])]
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $page = max(1, (int) $request->integer('page', 1));

        $meetings = Meeting::query()
            ->with(['schedules' => fn ($query) => $query->orderBy('date')->orderBy('start_time')])
            ->latest('id')
            ->paginate($perPage, ['*'], 'page', $page);

        $data = $meetings->getCollection()
            ->map(fn (Meeting $meeting) => (new MeetingResource($meeting))->toArray($request))
            ->values()
            ->all();

        return $this->formatListingResponse($meetings, $data);
    }

    #[Endpoint(title: 'Create Meeting')]
    #[BodyParameter('title', required: true, example: 'Math Session')]
    #[BodyParameter('description', required: false, example: 'Weekly tutoring')]
    #[BodyParameter('type', required: true, example: 'virtual')]
    #[BodyParameter('platform', required: false, example: 'Google Meet')]
    #[BodyParameter('link', required: false, example: 'https://meet.example.com/abc')]
    #[BodyParameter('location', required: false, example: null)]
    #[BodyParameter('class_id', required: true, example: 1)]
    #[BodyParameter('meeting_schedules', required: true, example: [
        ['date' => '2026-03-10', 'start_time' => '09:00', 'end_time' => '10:00'],
        ['date' => '2026-03-12', 'start_time' => '09:00', 'end_time' => '10:00'],
    ])]
    #[Response(status: 201, examples: [[
        'id' => 1,
        'title' => 'Math Session',
        'description' => 'Weekly tutoring',
        'type' => 'virtual',
        'platform' => 'Google Meet',
        'link' => 'https://meet.example.com/abc',
        'location' => null,
        'class_id' => 1,
        'meeting_schedules' => [[
            'id' => 1,
            'meeting_id' => 1,
            'date' => '2026-03-10',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'note' => 'Focus on algebra practice.',
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ]],
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-01T00:00:00.000000Z',
    ]])]
    public function store(StoreMeetingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $meeting = DB::transaction(function () use ($validated): Meeting {
            $meeting = Meeting::query()->create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'platform' => $validated['platform'] ?? null,
                'link' => $validated['link'] ?? null,
                'location' => $validated['location'] ?? null,
                'class_id' => (int) $validated['class_id'],
            ]);

            $meeting->schedules()->createMany(array_map(
                static fn (array $schedule): array => [
                    'date' => $schedule['date'],
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time'],
                ],
                $validated['meeting_schedules']
            ));

            return $meeting;
        });

        return response()->json(
            new MeetingResource($meeting->load(['schedules' => fn ($query) => $query->orderBy('date')->orderBy('start_time')])),
            201
        );
    }

    #[Endpoint(title: 'Get Meeting')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'title' => 'Math Session',
        'description' => 'Weekly tutoring',
        'type' => 'virtual',
        'platform' => 'Google Meet',
        'link' => 'https://meet.example.com/abc',
        'location' => null,
        'class_id' => 1,
        'meeting_schedules' => [[
            'id' => 1,
            'meeting_id' => 1,
            'date' => '2026-03-10',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'note' => 'Focus on algebra practice.',
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ]],
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-01T00:00:00.000000Z',
    ]])]
    public function show(Meeting $meeting): JsonResponse
    {
        return response()->json(new MeetingResource(
            $meeting->load(['schedules' => fn ($query) => $query->orderBy('date')->orderBy('start_time')])
        ));
    }

    #[Endpoint(title: 'Update Meeting')]
    #[BodyParameter('title', required: false, example: 'Math Session - Updated')]
    #[BodyParameter('description', required: false, example: 'Updated detail')]
    #[BodyParameter('type', required: false, example: 'physical')]
    #[BodyParameter('platform', required: false, example: 'Campus Room A')]
    #[BodyParameter('link', required: false, example: null)]
    #[BodyParameter('location', required: false, example: 'Building A, Room 203')]
    #[Response(status: 200, examples: [[
        'id' => 1,
        'title' => 'Math Session - Updated',
        'description' => 'Updated detail',
        'type' => 'physical',
        'platform' => 'Campus Room A',
        'link' => null,
        'location' => 'Building A, Room 203',
        'class_id' => 1,
        'meeting_schedules' => [[
            'id' => 1,
            'meeting_id' => 1,
            'date' => '2026-03-10',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'note' => 'Bring chapter 5 worksheet',
            'created_at' => '2026-03-01T00:00:00.000000Z',
            'updated_at' => '2026-03-01T00:00:00.000000Z',
        ]],
        'created_at' => '2026-03-01T00:00:00.000000Z',
        'updated_at' => '2026-03-02T00:00:00.000000Z',
    ]])]
    public function update(UpdateMeetingRequest $request, Meeting $meeting): JsonResponse
    {
        $meeting->update($request->validated());

        return response()->json(new MeetingResource(
            $meeting->fresh()->load(['schedules' => fn ($query) => $query->orderBy('date')->orderBy('start_time')])
        ));
    }

    #[Endpoint(title: 'Delete Meeting')]
    #[Response(status: 204, examples: [[null]])]
    public function destroy(Meeting $meeting): JsonResponse
    {
        $meeting->delete();

        return response()->json(null, 204);
    }
}

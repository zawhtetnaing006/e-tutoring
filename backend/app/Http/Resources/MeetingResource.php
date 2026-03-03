<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property \App\Models\Meeting $resource
 */
class MeetingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'title' => $this->resource->title,
            'description' => $this->resource->description,
            'type' => $this->resource->type,
            'platform' => $this->resource->platform,
            'link' => $this->resource->link,
            'location' => $this->resource->location,
            'class_id' => $this->resource->class_id,
            'meeting_schedules' => $this->whenLoaded('schedules', fn () => $this->resource->schedules
                ->map(static fn ($schedule): array => [
                    'id' => $schedule->id,
                    'meeting_id' => $schedule->meeting_id,
                    'date' => $schedule->date,
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'created_at' => $schedule->created_at?->toISOString(),
                    'updated_at' => $schedule->updated_at?->toISOString(),
                ])->values()),
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

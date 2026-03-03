<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property \App\Models\MeetingSchedule $resource
 */
class MeetingScheduleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'meeting_id' => $this->resource->meeting_id,
            'date' => $this->resource->date,
            'start_time' => $this->resource->start_time,
            'end_time' => $this->resource->end_time,
            'note' => $this->resource->note,
            'cancel_at' => $this->resource->cancel_at?->toISOString(),
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

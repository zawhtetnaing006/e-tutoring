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
            'meeting' => $this->whenLoaded('meeting', function (): ?array {
                $meeting = $this->resource->meeting;

                if ($meeting === null) {
                    return null;
                }

                return [
                    'id' => $meeting->id,
                    'title' => $meeting->title,
                    'description' => $meeting->description,
                    'type' => $meeting->type,
                    'platform' => $meeting->platform,
                    'link' => $meeting->link,
                    'location' => $meeting->location,
                    'tutor_assignment_id' => $meeting->tutor_assignment_id,
                    'tutor_user_id' => $meeting->tutorAssignment?->tutor_user_id,
                    'student_user_id' => $meeting->tutorAssignment?->student_user_id,
                    'tutor_name' => $meeting->tutorAssignment?->tutor?->name,
                    'student_name' => $meeting->tutorAssignment?->student?->name,
                    'schedule_count' => $meeting->relationLoaded('schedules')
                        ? $meeting->schedules->count()
                        : null,
                    'created_at' => $meeting->created_at?->toISOString(),
                    'updated_at' => $meeting->updated_at?->toISOString(),
                ];
            }),
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

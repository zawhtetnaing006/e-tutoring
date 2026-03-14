<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property \App\Models\TutorAssignment $resource
 */
class TutorAssignmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'tutor_user_id' => $this->resource->tutor_user_id,
            'student_user_id' => $this->resource->student_user_id,
            'from_date' => $this->resource->start_date,
            'to_date' => $this->resource->end_date,
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

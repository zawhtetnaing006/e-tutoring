<?php

namespace App\Http\Resources;

use App\Models\TutorAssignment;
use App\Models\TutorAssignmentMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $lastMessage = $this->resource instanceof TutorAssignment
            ? $this->resource->latestMessage
            : null;

        return [
            'id' => $this->resource->id,
            'tutor_user_id' => $this->resource->tutor_user_id,
            'student_user_id' => $this->resource->student_user_id,
            'start_date' => $this->resource->start_date,
            'end_date' => $this->resource->end_date,
            'tutor' => [
                'id' => (int) $this->resource->tutor_user_id,
                'name' => (string) ($this->resource->tutor?->name ?? ''),
            ],
            'student' => [
                'id' => (int) $this->resource->student_user_id,
                'name' => (string) ($this->resource->student?->name ?? ''),
            ],
            'last_message' => $lastMessage instanceof TutorAssignmentMessage
                ? new ChatMessageResource($lastMessage)
                : null,
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property \App\Models\BlogComment $resource
 */
class BlogCommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'blog_id' => $this->resource->blog_id,
            'comment_text' => $this->resource->comment_text,
            'commenter_user_id' => $this->resource->commenter_user_id,
            'commenter' => $this->whenLoaded('commenter', fn (): ?array => $this->resource->commenter === null ? null : [
                'id' => $this->resource->commenter->id,
                'uuid' => $this->resource->commenter->uuid,
                'name' => $this->resource->commenter->name,
                'user_type' => $this->resource->commenter->user_type,
            ]),
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

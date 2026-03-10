<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property \App\Models\Blog $resource
 */
class BlogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'title' => $this->resource->title,
            'content' => $this->resource->content,
            'author_user_id' => $this->resource->author_user_id,
            'author' => $this->whenLoaded('author', fn (): ?array => $this->resource->author === null ? null : [
                'id' => $this->resource->author->id,
                'uuid' => $this->resource->author->uuid,
                'name' => $this->resource->author->name,
                'user_type' => $this->resource->author->user_type,
            ]),
            'comment_count' => $this->whenCounted('comments'),
            'comments' => $this->whenLoaded(
                'comments',
                fn () => BlogCommentResource::collection($this->resource->comments),
            ),
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

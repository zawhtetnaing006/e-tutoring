<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property \App\Models\User $resource
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'uuid' => $this->resource->uuid,
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'phone' => $this->resource->phone,
            'address' => $this->resource->address,
            'country' => $this->resource->country,
            'city' => $this->resource->city,
            'township' => $this->resource->township,
            'is_active' => $this->resource->is_active,
            'user_type' => $this->resource->user_type,
            'subjects' => $this->whenLoaded('subjects', fn () => $this->resource->subjects->map(
                static fn ($subject): array => [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'description' => $subject->description,
                ],
            )->values()),
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

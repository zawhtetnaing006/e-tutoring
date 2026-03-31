<?php

namespace App\Http\Resources;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
        $this->resource->loadMissing('role:id,code,name');
        $role = $this->resource->role;
        $profileImagePath = $this->resource->profile_image_path;
        /** @var FilesystemAdapter $publicDisk */
        $publicDisk = Storage::disk('public');

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
            'profile_image_url' => $profileImagePath ? $publicDisk->url($profileImagePath) : null,
            'is_active' => $this->resource->is_active,
            'role_code' => $role?->code,
            'role_name' => $role?->name,
            'subjects' => $this->whenLoaded('subjects', fn () => $this->resource->subjects->map(
                static fn ($subject): array => [
                    'id' => $subject->id,
                    'name' => $subject->name,
                    'description' => $subject->description ?? null,
                ],
            )->values()),
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }
}

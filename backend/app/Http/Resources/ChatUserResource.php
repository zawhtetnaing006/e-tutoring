<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $roles = $this->relationLoaded('roles')
            ? $this->roles->pluck('code')->values()->all()
            : [];

        return [
            'id' => $this->resource->id,
            'name' => (string) $this->resource->name,
            'email' => (string) $this->resource->email,
            'roles' => $roles,
        ];
    }
}

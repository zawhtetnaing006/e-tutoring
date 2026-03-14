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
        $roleCode = $this->relationLoaded('role') ? $this->role?->code : null;

        return [
            'id' => $this->resource->id,
            'name' => (string) $this->resource->name,
            'email' => (string) $this->resource->email,
            'role_code' => $roleCode,
        ];
    }
}

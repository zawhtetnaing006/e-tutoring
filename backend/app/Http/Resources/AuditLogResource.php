<?php

namespace App\Http\Resources;

use App\Models\Activity;
use App\Services\AuditLogPresenter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Activity $resource
 */
class AuditLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $activity = $this->resource;
        $presentation = app(AuditLogPresenter::class)->present($activity);

        return [
            'id' => $activity->id,
            'date_time' => $activity->created_at?->toISOString(),
            'actor' => $presentation['actor'],
            'action' => $presentation['action'],
            'target' => $presentation['target'],
            'description' => $presentation['description'],
        ];
    }
}

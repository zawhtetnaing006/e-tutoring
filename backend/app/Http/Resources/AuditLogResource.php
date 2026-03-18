<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Spatie\Activitylog\Models\Activity;

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
        $meta = $this->propertiesArray($activity->getExtraProperty('meta', []));

        return [
            'id' => $activity->id,
            'date_time' => $activity->created_at?->toISOString(),
            'actor' => $this->actorLabel($activity),
            'action' => (string) ($meta['action_label'] ?? $activity->description),
            'target' => (string) ($meta['target_label'] ?? 'System'),
            'description' => (string) ($meta['description'] ?? ''),
        ];
    }

    private function actorLabel(Activity $activity): string
    {
        $user = $this->actorUser($activity);

        if (! $user instanceof User) {
            return 'System (Service)';
        }

        $user->loadMissing('role:id,code,name');
        $role = trim((string) ($user->role?->name ?? ''));

        if ($role === '') {
            $role = trim((string) ($user->role?->code ?? 'User'));
        }

        return sprintf('%s (%s)', $user->name, $role);
    }

    private function actorUser(Activity $activity): ?User
    {
        if ($activity->causer instanceof User) {
            return $activity->causer;
        }

        if (str_starts_with($activity->description, 'auth.') && $activity->subject instanceof User) {
            return $activity->subject;
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function propertiesArray(mixed $value): array
    {
        return is_array($value) ? $value : [];
    }
}

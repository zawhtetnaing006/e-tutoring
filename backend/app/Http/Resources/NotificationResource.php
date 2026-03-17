<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;

/**
 * @property DatabaseNotification $resource
 */
class NotificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = is_array($this->resource->data) ? $this->resource->data : [];
        $title = $data['title'] ?? null;
        $body = $data['body'] ?? null;

        return [
            'id' => $this->resource->id,
            'type' => $this->resolveType(),
            'is_read' => $this->resource->read_at !== null,
            'created_at' => $this->resource->created_at?->toISOString(),
            'title' => is_string($title) && $title !== '' ? $title : null,
            'body' => is_string($body) && $body !== '' ? $body : null,
            'action' => $this->resolveAction($data),
        ];
    }

    private function resolveType(): string
    {
        $notificationType = (string) $this->resource->type;

        if ($notificationType === '' || ! str_contains($notificationType, '\\')) {
            return $notificationType;
        }

        return (string) Str::of(class_basename($notificationType))
            ->replaceEnd('Notification', '')
            ->snake();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, int|string>|null
     */
    private function resolveAction(array $data): ?array
    {
        $conversationId = $data['conversation_id'] ?? null;

        if (! is_numeric($conversationId)) {
            return null;
        }

        return [
            'route' => '/communication-hub',
            'conversation_id' => (int) $conversationId,
        ];
    }
}

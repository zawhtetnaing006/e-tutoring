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
     * @return array<string, mixed>|null
     */
    private function resolveAction(array $data): ?array
    {
        $action = $data['action'] ?? null;

        if (is_array($action)) {
            $route = trim((string) ($action['route'] ?? ''));

            if ($route !== '') {
                $resolvedAction = [
                    'route' => $route,
                ];

                if (isset($action['params']) && is_array($action['params'])) {
                    $resolvedAction['params'] = $action['params'];
                }

                if (isset($action['query']) && is_array($action['query'])) {
                    $resolvedAction['query'] = $action['query'];
                }

                if (array_key_exists('conversation_id', $action) && is_numeric($action['conversation_id'])) {
                    $resolvedAction['conversation_id'] = (int) $action['conversation_id'];
                }

                return $resolvedAction;
            }
        }

        $conversationId = $data['conversation_id'] ?? null;

        if (! is_numeric($conversationId)) {
            return null;
        }

        return [
            'route' => '/communication-hub',
            'query' => [
                'conversation' => (int) $conversationId,
            ],
            'conversation_id' => (int) $conversationId,
        ];
    }
}

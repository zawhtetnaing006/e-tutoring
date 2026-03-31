<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Spatie\Activitylog\ActivityLogger;

class AuditLogService
{
    /**
     * @param  array<string, mixed>  $properties
     */
    public function log(
        Request $request,
        string $description,
        ?Model $subject = null,
        array $properties = [],
        ?string $event = null,
    ): void
    {
        $logger = activity('audit')->causedBy($request->user());

        $this->write($logger, $description, $subject, $properties, $event);
    }

    /**
     * @param  array<string, mixed>  $properties
     */
    public function logSystem(
        string $description,
        ?Model $subject = null,
        array $properties = [],
        ?string $event = null,
    ): void
    {
        $this->write(activity('audit'), $description, $subject, $properties, $event);
    }

    public function logCreated(
        Request $request,
        string $description,
        ?Model $subject,
        string $actionLabel,
        string $targetLabel,
        ?string $event = 'created',
        array $properties = [],
    ): void
    {
        $this->log(
            request: $request,
            description: $description,
            subject: $subject,
            properties: $this->withMeta($properties, [
                'action_label' => $actionLabel,
                'target_label' => $targetLabel,
                'operation' => 'created',
            ]),
            event: $event,
        );
    }

    public function logDeleted(
        Request $request,
        string $description,
        ?Model $subject,
        string $actionLabel,
        string $targetLabel,
        ?string $event = 'deleted',
        array $properties = [],
    ): void
    {
        $this->log(
            request: $request,
            description: $description,
            subject: $subject,
            properties: $this->withMeta($properties, [
                'action_label' => $actionLabel,
                'target_label' => $targetLabel,
                'operation' => 'deleted',
            ]),
            event: $event,
        );
    }

    /**
     * @param  array{old: array<string, mixed>, attributes: array<string, mixed>}  $changes
     * @param  array<string>  $fieldLabels
     */
    public function logUpdated(
        Request $request,
        string $description,
        ?Model $subject,
        string $actionLabel,
        string $targetLabel,
        array $changes,
        array $fieldLabels = [],
        ?string $event = 'updated',
    ): void
    {
        $this->log(
            request: $request,
            description: $description,
            subject: $subject,
            properties: $this->withMeta([
                'old' => $changes['old'],
                'attributes' => $changes['attributes'],
            ], [
                'action_label' => $actionLabel,
                'target_label' => $targetLabel,
                'operation' => 'updated',
                'field_labels' => array_values(array_unique($fieldLabels)),
            ]),
            event: $event,
        );
    }

    /**
     * @param  array<string, mixed>  $old
     * @param  array<string, mixed>  $attributes
     */
    public function logStatusUpdated(
        Request $request,
        string $description,
        ?Model $subject,
        string $actionLabel,
        string $targetLabel,
        array $old,
        array $attributes,
        string $statusValue,
        ?string $event = 'updated',
    ): void
    {
        $this->log(
            request: $request,
            description: $description,
            subject: $subject,
            properties: $this->withMeta([
                'old' => $old,
                'attributes' => $attributes,
            ], [
                'action_label' => $actionLabel,
                'target_label' => $targetLabel,
                'operation' => 'status_updated',
                'status_value' => $statusValue,
            ]),
            event: $event,
        );
    }

    public function logCounted(
        Request $request,
        string $description,
        string $actionLabel,
        string $targetLabel,
        int $count,
        string $itemLabel,
        string $verb,
        ?string $event = null,
        ?Model $subject = null,
    ): void
    {
        $this->log(
            request: $request,
            description: $description,
            subject: $subject,
            properties: $this->withMeta([], [
                'action_label' => $actionLabel,
                'target_label' => $targetLabel,
                'operation' => 'counted',
                'count' => $count,
                'item_label' => $itemLabel,
                'count_verb' => $verb,
            ]),
            event: $event,
        );
    }

    /**
     * @param  array<string, mixed>  $properties
     * @param  array<string, mixed>  $meta
     */
    public function logAction(
        Request $request,
        string $description,
        ?Model $subject,
        string $actionLabel,
        string $targetLabel,
        string $operation,
        array $properties = [],
        array $meta = [],
        ?string $event = null,
    ): void
    {
        $this->log(
            request: $request,
            description: $description,
            subject: $subject,
            properties: $this->withMeta($properties, [
                'action_label' => $actionLabel,
                'target_label' => $targetLabel,
                'operation' => $operation,
                ...$meta,
            ]),
            event: $event,
        );
    }

    /**
     * @param  array<string, mixed>  $properties
     * @param  array<string, mixed>  $meta
     */
    public function logSystemAction(
        string $description,
        ?Model $subject,
        string $actionLabel,
        string $targetLabel,
        string $operation,
        array $properties = [],
        array $meta = [],
        ?string $event = null,
    ): void
    {
        $this->logSystem(
            description: $description,
            subject: $subject,
            properties: $this->withMeta($properties, [
                'action_label' => $actionLabel,
                'target_label' => $targetLabel,
                'operation' => $operation,
                ...$meta,
            ]),
            event: $event,
        );
    }

    /**
     * @param  array{old: array<string, mixed>, attributes: array<string, mixed>}  $changes
     * @param  array<string, string>  $labelMap
     * @param  array<string>  $extraLabels
     * @return array<string>
     */
    public function fieldLabels(array $changes, array $labelMap = [], array $extraLabels = []): array
    {
        $fields = array_values(array_unique([
            ...array_keys($changes['old']),
            ...array_keys($changes['attributes']),
        ]));

        $labels = array_map(
            static fn (string $field): string => $labelMap[$field] ?? strtolower(str_replace('_', ' ', $field)),
            $fields,
        );

        return array_values(array_unique([
            ...$labels,
            ...$extraLabels,
        ]));
    }

    /**
     * @param  ActivityLogger  $logger
     * @param  array<string, mixed>  $properties
     */
    private function write(
        ActivityLogger $logger,
        string $description,
        ?Model $subject,
        array $properties,
        ?string $event,
    ): void
    {

        if ($subject !== null) {
            $logger->performedOn($subject);
        }

        $properties = array_filter(
            $properties,
            static fn (mixed $value): bool => $value !== null && $value !== []
        );

        if ($properties !== []) {
            $logger->withProperties($properties);
        }

        if ($event !== null) {
            $logger->event($event);
        }

        $logger->log($description);
    }

    /**
     * @param  array<string, mixed>  $properties
     * @param  array<string, mixed>  $meta
     * @return array<string, mixed>
     */
    private function withMeta(array $properties, array $meta): array
    {
        $existingMeta = $properties['meta'] ?? [];

        if (! is_array($existingMeta)) {
            $existingMeta = [];
        }

        $properties['meta'] = array_filter([
            ...$existingMeta,
            ...$meta,
        ], static fn (mixed $value): bool => $value !== null && $value !== []);

        return $properties;
    }

    /**
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     * @return array{old: array<string, mixed>, attributes: array<string, mixed>}
     */
    public function diff(array $before, array $after): array
    {
        $oldValues = [];
        $newValues = [];

        foreach (array_values(array_unique([
            ...array_keys($before),
            ...array_keys($after),
        ])) as $key) {
            $beforeHasValue = array_key_exists($key, $before);
            $afterHasValue = array_key_exists($key, $after);
            $beforeValue = $before[$key] ?? null;
            $afterValue = $after[$key] ?? null;

            if ($beforeHasValue === $afterHasValue && $beforeValue === $afterValue) {
                continue;
            }

            if ($beforeHasValue) {
                $oldValues[$key] = $beforeValue;
            }

            if ($afterHasValue) {
                $newValues[$key] = $afterValue;
            }
        }

        return [
            'old' => $oldValues,
            'attributes' => $newValues,
        ];
    }
}

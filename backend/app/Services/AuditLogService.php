<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

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

<?php

namespace App\Http\Middleware;

use App\Models\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        if ($allowedRoles === []) {
            return $next($request);
        }

        $user = $request->user();
        $normalizedAllowedRoles = collect($allowedRoles)
            ->map(static fn (string $role): string => strtoupper(trim($role)))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $currentRole = $user?->role?->code;
        $currentRoles = $currentRole === null
            ? []
            : [strtoupper((string) $currentRole)];

        if ($user === null) {
            return response()->json([
                'message' => 'Access denied for your role.',
                'error' => [
                    'code' => 'ROLE_FORBIDDEN',
                    'details' => [
                        'current_roles' => $currentRoles,
                        'allowed_roles' => $normalizedAllowedRoles,
                    ],
                ],
            ], 403);
        }

        if ($user->hasRole(Role::ADMIN)) {
            return $next($request);
        }

        if (! $user->hasAnyRole($normalizedAllowedRoles)) {
            return response()->json([
                'message' => 'Access denied for your role.',
                'error' => [
                    'code' => 'ROLE_FORBIDDEN',
                    'details' => [
                        'current_roles' => $currentRoles,
                        'allowed_roles' => $normalizedAllowedRoles,
                    ],
                ],
            ], 403);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserType
{
    public function handle(Request $request, Closure $next, string ...$allowedTypes): Response
    {
        if ($allowedTypes === []) {
            return $next($request);
        }

        $userType = strtoupper((string) ($request->attributes->get('user_type') ?? $request->user()?->user_type));
        $normalizedAllowedTypes = array_map(static fn (string $type): string => strtoupper(trim($type)), $allowedTypes);

        if ($userType === '' || ! in_array($userType, $normalizedAllowedTypes, true)) {
            return response()->json([
                'message' => 'Access denied for your user type.',
                'error' => [
                    'code' => 'USER_TYPE_FORBIDDEN',
                    'details' => [
                        'current_user_type' => $userType === '' ? null : $userType,
                        'allowed_user_types' => array_values($normalizedAllowedTypes),
                    ],
                ],
            ], 403);
        }

        return $next($request);
    }
}

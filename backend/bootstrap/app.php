<?php

use App\Http\Middleware\EnsureUserRole;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['middleware' => ['api', 'auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureUserRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'error' => [
                        'code' => 'VALIDATION_ERROR',
                        'status' => 422,
                        'details' => [
                            'errors' => $e->errors(),
                        ],
                    ],
                ], 422);
            }

            if ($e instanceof AuthenticationException) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'error' => [
                        'code' => 'UNAUTHENTICATED',
                        'status' => 401,
                    ],
                ], 401);
            }

            if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                return response()->json([
                    'message' => 'Resource not found.',
                    'error' => [
                        'code' => 'NOT_FOUND',
                        'status' => 404,
                    ],
                ], 404);
            }

            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();
                $message = $e->getMessage() !== '' ? $e->getMessage() : 'Request failed.';

                return response()->json([
                    'message' => $message,
                    'error' => [
                        'code' => 'HTTP_ERROR',
                        'status' => $status,
                    ],
                ], $status);
            }

            return response()->json([
                'message' => 'Something went wrong.',
                'error' => [
                    'code' => 'INTERNAL_SERVER_ERROR',
                    'status' => 500,
                ],
            ], 500);
        });
    })->create();

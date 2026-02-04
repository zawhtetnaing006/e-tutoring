<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogViewerBasicAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $expectedUsername = 'e-tutoring-admin-XX-EE-YY-ZZ';
        $expectedPassword = 'e-tutoring-pass-XX-EE-YY-ZZ';

        if ($expectedUsername === '' || $expectedPassword === '') {
            abort(403);
        }

        $username = (string) $request->getUser();
        $password = (string) $request->getPassword();

        $validUsername = hash_equals($expectedUsername, $username);
        $validPassword = hash_equals($expectedPassword, $password);

        if ($validUsername && $validPassword) {
            return $next($request);
        }

        return response('Unauthorized', 401)
            ->withHeaders([
                'WWW-Authenticate' => 'Basic realm="Log Viewer"',
            ]);
    }
}


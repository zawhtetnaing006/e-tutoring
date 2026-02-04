<?php

$config = require base_path('vendor/opcodesio/log-viewer/config/log-viewer.php');

$config['middleware'] = [
    'web',
    \App\Http\Middleware\LogViewerBasicAuth::class,
    \Opcodes\LogViewer\Http\Middleware\AuthorizeLogViewer::class,
];

$config['api_middleware'] = [
    \App\Http\Middleware\LogViewerBasicAuth::class,
    \Opcodes\LogViewer\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    \Opcodes\LogViewer\Http\Middleware\AuthorizeLogViewer::class,
];

return $config;

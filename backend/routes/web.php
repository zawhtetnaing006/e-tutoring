<?php

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::get('/health-check', function () {
    Log::info('Health check endpoint accessed.');
    return response()->json(['status' => 'OK']);
});

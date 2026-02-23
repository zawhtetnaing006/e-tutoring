<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use Illuminate\Support\Facades\Route;

Route::get('/health', \App\Http\Controllers\Api\HealthCheckController::class);

Route::prefix('auth')
    ->controller(AuthController::class)
    ->group(function () {
        Route::post('login', 'login');
        Route::post('forgot-password', 'forgotPassword');
        Route::post('verify-reset-code', 'verifyResetCode');
        Route::post('reset-password', 'resetPassword');

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me', 'me');
            Route::post('logout', 'logout');
        });
    });

Route::middleware('auth:sanctum')
    ->prefix('chat')
    ->controller(ChatController::class)
    ->group(function () {
        Route::post('direct', 'createDirectConversation');
        Route::get('{conversation}/messages', 'listMessages');
        Route::post('{conversation}/messages', 'sendMessage');
    });

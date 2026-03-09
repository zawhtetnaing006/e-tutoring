<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ClassRoomController;
use App\Http\Controllers\Api\MeetingAttendanceController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\MeetingScheduleController;
use App\Http\Controllers\Api\NotiController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkScheduleController;
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
        Route::get('/', 'listConversations');
        Route::get('{conversation}/messages', 'listMessages');
        Route::post('{conversation}/messages', 'sendMessage');
    });

Route::middleware(['auth:sanctum', 'user_type:STAFF'])
    ->prefix('users')
    ->controller(UserController::class)
    ->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::get('{user}', 'show');
        Route::put('{user}', 'update');
        Route::delete('{user}', 'destroy');
    });

Route::middleware(['auth:sanctum', 'user_type:STAFF'])
    ->prefix('subjects')
    ->controller(SubjectController::class)
    ->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::get('{subject}', 'show');
        Route::put('{subject}', 'update');
        Route::delete('{subject}', 'destroy');
    });

Route::prefix('class-rooms')
    ->controller(ClassRoomController::class)
    ->group(function () {
        Route::middleware(['auth:sanctum', 'user_type:STAFF,TUTOR,STUDENT'])->group(function () {
            Route::get('/', 'index');
            Route::get('{classRoom}', 'show');
        });

        Route::middleware(['auth:sanctum', 'user_type:STAFF'])->group(function () {
            Route::post('/', 'store');
            Route::delete('/', 'bulkDestroy');
            Route::put('{classRoom}', 'update');
            Route::delete('{classRoom}', 'destroy');
        });
    });

Route::prefix('work-schedules')
    ->controller(WorkScheduleController::class)
    ->group(function () {
        Route::middleware(['auth:sanctum', 'user_type:STAFF,TUTOR,STUDENT'])->group(function () {
            Route::get('/', 'index');
            Route::get('{workSchedule}', 'show');
        });

        Route::middleware(['auth:sanctum', 'user_type:STAFF,TUTOR'])->group(function () {
            Route::post('/', 'store');
            Route::put('{workSchedule}', 'update');
            Route::delete('{workSchedule}', 'destroy');
        });
    });

Route::middleware(['auth:sanctum', 'user_type:STAFF'])
    ->prefix('meetings')
    ->controller(MeetingController::class)
    ->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::get('{meeting}', 'show');
        Route::put('{meeting}', 'update');
        Route::delete('{meeting}', 'destroy');
    });

Route::middleware(['auth:sanctum', 'user_type:STAFF'])
    ->prefix('meeting-schedules')
    ->controller(MeetingScheduleController::class)
    ->group(function () {
        Route::put('{meetingSchedule}', 'update');
        Route::post('{meetingSchedule}/cancel', 'cancel');
    });

Route::middleware(['auth:sanctum', 'user_type:STAFF'])
    ->prefix('meeting-attendances')
    ->controller(MeetingAttendanceController::class)
    ->group(function () {
        Route::post('/', 'store');
    });

Route::middleware('auth:sanctum')
    ->prefix('notis')
    ->controller(NotiController::class)
    ->group(function () {
        Route::get('/', 'index');
    });

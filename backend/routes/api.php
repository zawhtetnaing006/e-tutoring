<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\TutorAssignmentController;
use App\Http\Controllers\Api\MeetingAttendanceController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\MeetingScheduleController;
use App\Http\Controllers\Api\NotificationController;
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
        Route::get('search', 'searchChatUsers');
        Route::post('conversations', 'startConversation');
        Route::get('{conversation}/messages', 'listMessages');
        Route::post('{conversation}/messages', 'sendMessage');
        Route::post('{conversation}/seen', 'markConversationSeen');
        Route::get('{conversation}/documents', 'listSharedDocuments');
        Route::post('{conversation}/documents', 'uploadSharedDocument');
        Route::get('documents/{document}/comments', 'listDocumentComments');
        Route::post('documents/{document}/comments', 'addDocumentComment');
    });

Route::prefix('blogs')
    ->controller(BlogController::class)
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::get('/', 'index');
        Route::get('{blog}', 'show');
        Route::get('{blog}/comments', 'listComments');
        Route::post('/', 'store');
        Route::put('{blog}', 'update');
        Route::post('{blog}/toggle-status', 'toggleStatus');
        Route::delete('{blog}', 'destroy');
        Route::post('{blog}/comments', 'storeComment');
    });

Route::middleware(['auth:sanctum', 'role:STAFF'])
    ->prefix('users')
    ->controller(UserController::class)
    ->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::get('{user}', 'show');
        Route::put('{user}', 'update');
        Route::delete('{user}', 'destroy');
    });

Route::middleware(['auth:sanctum', 'role:STAFF'])
    ->prefix('subjects')
    ->controller(SubjectController::class)
    ->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::get('{subject}', 'show');
        Route::put('{subject}', 'update');
        Route::delete('{subject}', 'destroy');
    });

Route::prefix('tutor-assignments')
    ->controller(TutorAssignmentController::class)
    ->group(function () {
        Route::middleware(['auth:sanctum', 'role:STAFF,TUTOR,STUDENT'])->group(function () {
            Route::get('/', 'index');
            Route::get('{tutorAssignment}', 'show');
        });

        Route::middleware(['auth:sanctum', 'role:STAFF'])->group(function () {
            Route::post('/', 'store');
            Route::delete('/', 'bulkDestroy');
            Route::put('{tutorAssignment}', 'update');
            Route::delete('{tutorAssignment}', 'destroy');
        });
    });

Route::prefix('work-schedules')
    ->controller(WorkScheduleController::class)
    ->group(function () {
        Route::middleware(['auth:sanctum', 'role:STAFF,TUTOR,STUDENT'])->group(function () {
            Route::get('/', 'index');
            Route::get('{workSchedule}', 'show');
        });

        Route::middleware(['auth:sanctum', 'role:STAFF,TUTOR'])->group(function () {
            Route::post('/', 'store');
            Route::put('{workSchedule}', 'update');
            Route::delete('{workSchedule}', 'destroy');
        });
    });

Route::middleware(['auth:sanctum', 'role:STAFF'])
    ->prefix('meetings')
    ->controller(MeetingController::class)
    ->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::get('{meeting}', 'show');
        Route::put('{meeting}', 'update');
        Route::delete('{meeting}', 'destroy');
    });

Route::middleware(['auth:sanctum', 'role:STAFF'])
    ->prefix('meeting-schedules')
    ->controller(MeetingScheduleController::class)
    ->group(function () {
        Route::put('{meetingSchedule}', 'update');
        Route::post('{meetingSchedule}/cancel', 'cancel');
    });

Route::middleware(['auth:sanctum', 'role:STAFF'])
    ->prefix('meeting-attendances')
    ->controller(MeetingAttendanceController::class)
    ->group(function () {
        Route::post('/', 'store');
    });

Route::middleware('auth:sanctum')
    ->prefix('notifications')
    ->controller(NotificationController::class)
    ->group(function () {
        Route::get('/', 'index');
    });

// Backward compatibility for older clients.
Route::middleware('auth:sanctum')
    ->prefix('notis')
    ->controller(NotificationController::class)
    ->group(function () {
        Route::get('/', 'index');
    });

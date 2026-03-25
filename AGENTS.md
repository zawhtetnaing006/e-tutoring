# AGENTS.md

## Overview

This repository is split into two application roots:

- `frontend/`: React 19 + TypeScript + Vite SPA
- `backend/`: Laravel 12 API and supporting services

Top-level scripts and Docker files are for local orchestration. The root `README.md` is primarily about running the Laravel stack in Docker.

## Root Structure

- `frontend/`: browser app, UI, client-side routing, API consumers, realtime client
- `backend/`: API, auth, business logic, database schema, notifications, broadcasts
- `docker/`: nginx and php container definitions
- `docker-compose.local.yml`: local stack with nginx, php-fpm, mysql, redis, adminer, mailhog
- `docker-compose.prod.yml`: production-oriented compose file
- `artisan`, `composer`, `dev-restart`, `deploy`: root helper scripts that wrap backend/container workflows

## Frontend

### Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form + Zod
- Zustand
- Tailwind CSS
- Sonner
- Laravel Echo + Pusher client for Reverb

### Frontend Entry Flow

- `frontend/src/main.tsx`: mounts the app and global CSS
- `frontend/src/providers/index.tsx`: wraps the app with `QueryClientProvider`, `BrowserRouter`, `Toaster`, and React Query Devtools in development
- `frontend/src/App.tsx`: renders route definitions
- `frontend/src/routes/AppRoutes.tsx`: defines public and protected route trees
- `frontend/src/routes/ProtectedRoute.tsx`: redirects unauthenticated users to `/login`

### Frontend Directory Conventions

- `frontend/src/pages/`: route-level screens
- `frontend/src/features/`: domain logic, API calls, hooks, and feature-specific helpers
- `frontend/src/components/`: reusable UI and domain components
- `frontend/src/layouts/`: route shell layouts such as public vs dashboard
- `frontend/src/lib/`: shared infrastructure like API client and query client
- `frontend/src/hooks/`: general reusable hooks
- `frontend/src/routes/`: route components and route path helpers
- `frontend/src/styles/`, `frontend/src/design-tokens/`: global styling and tokens
- `frontend/src/config/`, `frontend/src/types/`, `frontend/src/utils/`: shared app utilities and types
- `frontend/src/static_data/`: static navigation and similar config-like data
- `frontend/src/stores/`: Zustand stores

### Frontend Feature Shape

The frontend is mostly organized by domain. Common pattern:

- `features/<domain>/api.ts`: raw API calls
- `features/<domain>/use*.ts`: React Query hooks and feature hooks
- `pages/<domain>/`: route screens
- `components/<domain>/`: reusable UI for that domain

Main visible domains in this codebase:

- `auth`
- `users`
- `subjects`
- `allocations`
- `meetings`
- `chat`
- `notifications`
- `blogs`
- `audit-logs`

### Frontend Auth and API Notes

- Auth state is persisted in `frontend/src/features/auth/storage.ts` using localStorage key `etutor_auth`.
- `frontend/src/lib/api-client.ts` reads `VITE_API_BASE_URL` and centralizes fetch/error handling.
- The API client currently uses Bearer token headers from stored auth state; despite the README mentioning Sanctum cookies, the implemented frontend auth flow is token-based.

### Frontend Realtime

- Realtime client setup is in `frontend/src/features/chat/realtime.ts`.
- Laravel Echo connects to Reverb using `VITE_REVERB_*` environment variables.
- Notifications subscribe to the authenticated user's private channel in `frontend/src/features/notifications/useNotificationsRealtime.ts`.
- Chat-related realtime behavior is implemented under `frontend/src/features/chat/`.

### Frontend Routing

Public routes:

- `/login`
- `/forgot-password`
- `/password-reset/code`
- `/password-reset/new`

Protected dashboard routes include:

- `/`
- `/staffs`
- `/tutors`
- `/students`
- `/subjects`
- `/allocations`
- `/meeting-manager`
- `/blogs`
- `/communication-hub`
- `/notifications`
- `/audit-log`
- `/profile`

## Backend

### Stack

- Laravel 12
- PHP 8.2+
- Laravel Sanctum
- Laravel Reverb
- Spatie activity log
- dedoc/scramble for API docs
- PHPUnit

### Backend Directory Conventions

- `backend/routes/`: API, web, console, and broadcast channel routes
- `backend/app/Http/Controllers/Api/`: API controllers
- `backend/app/Http/Requests/`: request validation classes
- `backend/app/Http/Resources/`: response transformers
- `backend/app/Models/`: Eloquent models
- `backend/app/Services/`: business logic beyond thin controllers
- `backend/app/Events/`: broadcast/realtime events
- `backend/app/Notifications/`: notification classes
- `backend/app/Console/Commands/`: scheduled or manual console tasks
- `backend/database/migrations/`: schema evolution
- `backend/database/seeders/`: local/test seed data
- `backend/tests/Feature/` and `backend/tests/Unit/`: automated tests

### Backend API Shape

Main API routes are in `backend/routes/api.php`.

Public endpoints:

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-reset-code`
- `POST /api/auth/reset-password`

Authenticated areas:

- `auth`: current user and logout
- `analytics`
- `chat`
- `blogs`
- `notifications`

Staff-restricted areas:

- `users`
- `subjects`
- `meetings`
- `meeting-schedules`
- `meeting-attendances`
- `audit-logs`

Tutor assignments are mixed-role:

- staff can create/update/delete
- staff, tutor, and student can read

### Backend Architecture Notes

- Controllers are thin entrypoints; validation lives in `Http/Requests`, transformation in `Http/Resources`, and business rules often live in `app/Services`.
- `backend/app/Http/Middleware/EnsureUserRole.php` enforces role-based access. Admin bypass is built in.
- `backend/app/Services/AuthService.php` issues Sanctum personal access tokens and handles password reset OTP workflows.
- `backend/app/Services/ChatService.php` owns most chat and shared-document behavior, including notifications and event dispatching.

### Backend Realtime

- Reverb configuration is in `backend/config/reverb.php`.
- Broadcast events exist for message send/seen and shared document activity:
  - `MessageSent`
  - `MessageSeen`
  - `DocumentShared`
  - `DocumentCommentAdded`

### Backend Data Model Areas

The migration/model set shows these primary domains:

- users and roles
- subjects
- tutor assignments
- meetings, schedules, attendees
- conversations, members, messages
- documents and document comments
- blogs and blog comments
- notifications
- activity logs

## How Frontend and Backend Fit Together

- The frontend is a standalone SPA under `frontend/`.
- The backend exposes JSON endpoints under `/api`.
- Frontend features map closely to backend route groups and resources.
- Realtime is handled through Laravel Reverb on the backend and Laravel Echo on the frontend.
- The communication hub depends on both HTTP APIs and broadcast events.

## Working Notes For Future Agents

- Treat `frontend/` and `backend/` as separate apps with separate package managers and build pipelines.
- For UI work, start in `frontend/src/pages/`, `frontend/src/features/`, and `frontend/src/components/`.
- For API or business-rule changes, start in `backend/routes/api.php`, the relevant controller, request, service, resource, and model.
- If a frontend screen is failing, inspect the matching `features/<domain>/api.ts` file before changing UI components.
- If behavior involves auth or role gating, inspect both frontend auth hooks and backend middleware/routes.
- If behavior is realtime, inspect both `frontend/src/features/chat/realtime.ts` and backend events/services.
- Root Docker and helper scripts are operational tooling, not the core application architecture.

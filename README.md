# e-tutoring (Local Development)

This repo runs a Laravel app (in `backend/`) via Docker Compose:

- **nginx** (http://localhost:8000) → **php-fpm**
- **mysql** (database)
- **redis** (cache/session/queue)
- **adminer** (DB UI) at http://localhost:8000/adminer
- **mailhog** (SMTP + mail UI) at http://localhost:8025

Compose project names:
- Local: `e-tutoring-local`
- Prod: `e-tutoring-prod`

## Prerequisites

- Docker + Docker Compose (v2 plugin)
- Node.js (recommended) for Vite/Tailwind asset builds

## Quick start (Docker)

1) Start the stack:

### FOR MAC/LINUX
```bash
./dev-restart
```

### FOR WINDOW
```bash
bash dev-restart
```

2) PHP dependencies:

- `./dev-restart` runs `composer install` automatically if `backend/vendor/` is missing.
- If you change `backend/composer.lock`, re-run:

```bash
./composer install
```

3) Run migrations:

```bash
./artisan migrate
```

```bash
./artisan migrate
```

For production deployment:

```bash
bash deploy
```

4) Open the app:

- http://localhost:8000
- API base URL: `http://localhost:8000/api`
- MailHog UI: `http://localhost:8025`

## Scheduler (Sanctum token pruning)

Sanctum tokens are set to expire after 24 hours and should be pruned regularly.

Local (keeps running in foreground):
```bash
./artisan schedule:work
```

Production (cron every minute):
```bash
* * * * * cd /path/to/e-tutoring && ./artisan schedule:run >> /dev/null 2>&1
```

## Environment files

- If you need a new `APP_KEY`, print one without writing files:

```bash
./artisan key:generate --show
```

Then paste it into `backend/.env.local`.

## Log Viewer

- URL: http://localhost:8000/log-viewer

## API Doc
- Used dedoc/scramble for api doc. 
- URL: http://localhost:8000/docs/api

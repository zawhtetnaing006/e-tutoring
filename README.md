# Laravel Starter Kit (Local Development)

This repo runs a Laravel app (in `backend/`) via Docker Compose:

- **nginx** (http://localhost:8000) → **php-fpm**
- **mysql** (database)
- **redis** (cache/session/queue)
- **adminer** (DB UI) at http://localhost:8000/adminer

## Prerequisites

- Docker + Docker Compose (v2 plugin)
- Node.js (recommended) for Vite/Tailwind asset builds

## Quick start (Docker)

1) Start the stack:

```bash
./dev-restart
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

4) Open the app:

- http://localhost:8000

## Environment files

- If you need a new `APP_KEY`, print one without writing files:

```bash
./artisan key:generate --show
```

Then paste it into `backend/.env.local`.


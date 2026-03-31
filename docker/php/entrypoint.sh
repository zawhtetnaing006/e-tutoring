#!/bin/sh
set -eu

APP_DIR="${APP_DIR:-/var/www}"

ensure_dir() {
  mkdir -p "$1"
}

env_file_value() {
  KEY="$1"
  FILE="$2"

  if [ ! -f "$FILE" ]; then
    return 1
  fi

  sed -n "s/^${KEY}=//p" "$FILE" | head -n 1 | sed 's/^"//; s/"$//'
}

wait_for_tcp() {
  HOST="$1"
  PORT="$2"
  MAX_ATTEMPTS="$3"
  RETRY_DELAY="$4"
  ATTEMPT=1

  while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do
    if php -r '
      $host = $argv[1];
      $port = (int) $argv[2];
      $timeout = 2.0;
      $errno = 0;
      $errstr = "";
      $socket = @fsockopen($host, $port, $errno, $errstr, $timeout);
      if ($socket) {
          fclose($socket);
          exit(0);
      }
      exit(1);
    ' "$HOST" "$PORT"; then
      return 0
    fi

    if [ "$ATTEMPT" -eq "$MAX_ATTEMPTS" ]; then
      echo "ERROR: ${HOST}:${PORT} is still unreachable after ${MAX_ATTEMPTS} attempts." >&2
      return 1
    fi

    echo "WARN: waiting for ${HOST}:${PORT} (${ATTEMPT}/${MAX_ATTEMPTS}); retrying in ${RETRY_DELAY}s." >&2
    ATTEMPT=$((ATTEMPT + 1))
    sleep "$RETRY_DELAY"
  done
}

# If .env is missing or empty and a local example exists, copy it once.
if [ ! -s "$APP_DIR/.env" ] && [ -f "$APP_DIR/.env.local.example" ]; then
  cp "$APP_DIR/.env.local.example" "$APP_DIR/.env"
fi

ensure_dir "$APP_DIR/storage"
ensure_dir "$APP_DIR/storage/app"
ensure_dir "$APP_DIR/storage/app/public"
ensure_dir "$APP_DIR/storage/framework/cache"
ensure_dir "$APP_DIR/storage/framework/sessions"
ensure_dir "$APP_DIR/storage/framework/views"
ensure_dir "$APP_DIR/storage/logs"
ensure_dir "$APP_DIR/bootstrap/cache"

# Best-effort permissions for bind mounts / volumes.
OWNER_USER="www-data"
OWNER_GROUP="www-data"

# In the dev image, PHP-FPM runs as `app:app` (see docker/php/www.dev.conf).
# In prod, it runs as `www-data:www-data`.
if id app >/dev/null 2>&1; then
  OWNER_USER="app"
  OWNER_GROUP="app"
fi

chown -R "${OWNER_USER}:${OWNER_GROUP}" \
  "$APP_DIR/storage" \
  "$APP_DIR/bootstrap/cache" \
  2>/dev/null || true

# Helpful warning for a common prod misconfig (app will throw MissingAppKeyException).
if [ -z "${APP_KEY:-}" ] && [ -f "$APP_DIR/.env" ]; then
  # shellcheck disable=SC2002
  APP_KEY_LINE="$(cat "$APP_DIR/.env" | sed -n 's/^APP_KEY=//p' | head -n 1 || true)"
  if [ -z "${APP_KEY_LINE:-}" ]; then
    echo "WARN: APP_KEY is not set (check $APP_DIR/.env). Laravel will not boot without it." >&2
  fi
fi

php "$APP_DIR/artisan" package:discover --ansi

if [ "${1:-}" = "php-fpm" ] && [ ! -e "$APP_DIR/public/storage" ] && [ ! -L "$APP_DIR/public/storage" ]; then
  php "$APP_DIR/artisan" storage:link
fi

if [ "${APP_RUN_MIGRATIONS:-0}" = "1" ]; then
  MAX_ATTEMPTS="${APP_MIGRATION_MAX_ATTEMPTS:-30}"
  RETRY_DELAY="${APP_MIGRATION_RETRY_DELAY:-2}"
  DB_HOST_VALUE="${DB_HOST:-$(env_file_value DB_HOST "$APP_DIR/.env" || true)}"
  DB_PORT_VALUE="${DB_PORT:-$(env_file_value DB_PORT "$APP_DIR/.env" || true)}"
  ATTEMPT=1

  if [ -n "${DB_HOST_VALUE:-}" ] && [ -n "${DB_PORT_VALUE:-}" ]; then
    wait_for_tcp "$DB_HOST_VALUE" "$DB_PORT_VALUE" "$MAX_ATTEMPTS" "$RETRY_DELAY"
  fi

  while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do
    if php "$APP_DIR/artisan" migrate --force; then
      break
    fi

    if [ "$ATTEMPT" -eq "$MAX_ATTEMPTS" ]; then
      echo "ERROR: migrations failed after ${MAX_ATTEMPTS} attempts." >&2
      exit 1
    fi

    echo "WARN: migration attempt ${ATTEMPT}/${MAX_ATTEMPTS} failed; retrying in ${RETRY_DELAY}s." >&2
    ATTEMPT=$((ATTEMPT + 1))
    sleep "$RETRY_DELAY"
  done
fi

exec "$@"

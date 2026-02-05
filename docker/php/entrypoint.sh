#!/bin/sh
set -eu

APP_DIR="${APP_DIR:-/var/www}"

ensure_dir() {
  mkdir -p "$1"
}

# If .env is missing but .env.local exists (common in local dev),
# copy it once on container start.
if [ ! -f "$APP_DIR/.env" ] && [ -f "$APP_DIR/.env.local" ]; then
  cp "$APP_DIR/.env.local" "$APP_DIR/.env"
fi

ensure_dir "$APP_DIR/storage"
ensure_dir "$APP_DIR/storage/app"
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

exec "$@"

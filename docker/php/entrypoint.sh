#!/bin/sh
set -eu

APP_DIR="${APP_DIR:-/var/www}"

ensure_dir() {
  mkdir -p "$1"
}

ensure_dir "$APP_DIR/storage"
ensure_dir "$APP_DIR/storage/app"
ensure_dir "$APP_DIR/storage/framework/cache"
ensure_dir "$APP_DIR/storage/framework/sessions"
ensure_dir "$APP_DIR/storage/framework/views"
ensure_dir "$APP_DIR/storage/logs"
ensure_dir "$APP_DIR/bootstrap/cache"

# Best-effort permissions for bind mounts / volumes.
chown -R www-data:www-data \
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

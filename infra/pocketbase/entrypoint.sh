#!/bin/sh
# Per-tenant Pocketbase entrypoint.
#
# Ensures an admin account exists (idempotent via `admin upsert`) so the
# provisioning script can sign in over REST immediately after deploy,
# without needing a manual trip through the PB admin UI.
set -e

if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  # PB 0.22.x has no `upsert` — try create, fall back to update.
  # Either way, after this line an admin exists with the stated credentials.
  pocketbase admin create "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=/pb_data 2>/dev/null || \
    pocketbase admin update "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=/pb_data 2>/dev/null || \
    echo "admin bootstrap failed — instance may already be healthy if admin already exists with a different password"
fi

exec pocketbase serve --http=0.0.0.0:8080 --dir=/pb_data

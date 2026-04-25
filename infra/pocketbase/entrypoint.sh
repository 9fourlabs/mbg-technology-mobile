#!/bin/sh
# Per-tenant Pocketbase entrypoint.
#
# Bootstraps the admin account from PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD env
# vars on first boot so the provisioning script can sign in over REST
# immediately after deploy, no manual trip through the admin UI.
#
# Order matters: `pocketbase admin create` requires the DB files to
# exist (data.db etc.). Those are created by `pocketbase serve` on
# first boot. So we start serve in the background, wait for /api/health
# to come up, then run admin create. SQLite WAL mode handles the
# concurrent read+write safely.
set -e

# Start PB serve in the background.
pocketbase serve --http=0.0.0.0:8080 --dir=/pb_data &
PB_PID=$!

# Wait up to 30s for the DB + HTTP listener to be ready.
for i in $(seq 1 30); do
  if wget -q -O /dev/null http://127.0.0.1:8080/api/health 2>/dev/null; then
    break
  fi
  sleep 1
done

# Idempotently bootstrap the admin. `create` fails on second boot if the
# admin already exists; we fall back to `update` so the password matches
# whatever's currently in the env (cheap rotation pattern).
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  pocketbase admin create "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=/pb_data \
    || pocketbase admin update "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=/pb_data \
    || echo "ENTRYPOINT: admin bootstrap failed (instance may still be usable if admin already exists with a different password)"
fi

# Keep the serve process in the foreground so Fly health checks see PB.
wait "$PB_PID"

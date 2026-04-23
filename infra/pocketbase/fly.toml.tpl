# Template for a per-tenant Pocketbase Fly app.
# scripts/provisionPocketbase.ts renders this by substituting:
#   {{APP_NAME}}  -> mbg-pb-<tenant-id>
#   {{REGION}}    -> iad (or override per tenant)
#   {{VOLUME}}    -> pb_data_<tenant-id>

app = "{{APP_NAME}}"
primary_region = "{{REGION}}"

[build]
  dockerfile = "Dockerfile"

[env]
  # Shared across every per-tenant PB instance — single admin account the
  # admin portal can reuse. Password is injected via
  # `fly secrets set PB_ADMIN_PASSWORD=...` (NOT baked into the image).
  PB_ADMIN_EMAIL = "pb-admin@9fourlabs.com"

[[mounts]]
  source = "{{VOLUME}}"
  destination = "/pb_data"
  initial_size = "1gb"

[http_service]
  internal_port = 8080
  force_https = true
  # Scale to zero when idle — PB cold-start is ~1s from suspended state.
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  size = "shared-cpu-1x"
  memory = "256mb"

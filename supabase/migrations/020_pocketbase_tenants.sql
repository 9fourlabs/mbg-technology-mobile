-- Add Pocketbase-backend columns to the tenants registry.
--
-- Phase 0 of the Supabase → Pocketbase migration. Each tenant can now
-- optionally point at its own Pocketbase instance (a dedicated Fly app).
-- The `backend` flag controls which data store the admin portal + mobile
-- app read from, so tenants can be migrated one at a time with rollback.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pocketbase_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pocketbase_app_name TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS backend TEXT NOT NULL DEFAULT 'supabase'
  CHECK (backend IN ('supabase', 'pocketbase'));

CREATE INDEX IF NOT EXISTS tenants_backend_idx ON tenants (backend);

COMMENT ON COLUMN tenants.pocketbase_url IS 'Base URL of the tenant''s Pocketbase instance (e.g. https://mbg-pb-<tenant>.fly.dev). NULL until provisioned.';
COMMENT ON COLUMN tenants.pocketbase_app_name IS 'Fly app name for this tenant''s Pocketbase instance — used for ops commands.';
COMMENT ON COLUMN tenants.backend IS 'Which backend serves this tenant''s per-tenant data. "supabase" = legacy central DB, "pocketbase" = dedicated PB instance.';

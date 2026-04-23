-- Stamp each build with a canonical hash of the tenant config that triggered it.
-- The admin UI compares this against the draft config hash to surface
-- "unpublished changes" indicators on the config editor, builds page, and
-- tenant list card. See admin/src/lib/config-hash.ts for the hash function.
ALTER TABLE builds ADD COLUMN IF NOT EXISTS config_hash TEXT;

CREATE INDEX IF NOT EXISTS builds_tenant_profile_status_created_at_idx
  ON builds (tenant_id, profile, status, created_at DESC);

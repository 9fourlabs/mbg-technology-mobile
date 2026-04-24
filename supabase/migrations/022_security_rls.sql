-- ============================================================================
-- Migration 022: Defense-in-depth RLS for cross-tenant tables
-- ============================================================================
--
-- Catches the case where a route forgets to call requireTenantAccess().
-- The 4 admin routes (save-config, trigger-build, version, analytics)
-- have all been patched in this PR; this migration ensures the DB itself
-- says no if a future route ever skips that check.
--
-- Tables affected:
--   push_tokens     — RLS was never enabled (migration 010 omitted it)
--   analytics_events — RLS was enabled but with an `USING (true)` allow-all
--                      policy that was effectively no scoping
--
-- Strategy: re-use the is_mbg_admin() helper introduced by migration 015
-- (tenant_users + roles). Authenticated users see only rows for tenants
-- they're a member of via tenant_users. Service role bypasses RLS so the
-- mobile app's anonymous analytics ingest still works.

-- ── push_tokens ─────────────────────────────────────────────────────────────
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_tokens_admin_all ON push_tokens;
CREATE POLICY push_tokens_admin_all ON push_tokens
  FOR ALL
  TO authenticated
  USING (
    is_mbg_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = push_tokens.tenant_id
    )
  )
  WITH CHECK (
    is_mbg_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = push_tokens.tenant_id
    )
  );

-- The mobile app registers tokens via the admin API using the service role
-- (anonymous end-users have no Supabase session against the admin DB).
-- Service role bypasses RLS — no explicit grant needed.

-- ── analytics_events ────────────────────────────────────────────────────────
-- The previous "Service role full access" policy used USING (true) which
-- granted ALL roles (including authenticated end-users) read on every
-- tenant's events. Replace with a tenant-scoped policy for authenticated
-- users; service role still bypasses RLS for ingest from mobile.
DROP POLICY IF EXISTS "Service role full access" ON analytics_events;

DROP POLICY IF EXISTS analytics_events_admin_read ON analytics_events;
CREATE POLICY analytics_events_admin_read ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    is_mbg_admin()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = analytics_events.tenant_id
    )
  );

-- No INSERT/UPDATE/DELETE policy for authenticated users — mobile app
-- ingest goes through the admin API with the service role.

COMMENT ON POLICY push_tokens_admin_all ON push_tokens IS
  'Defense-in-depth: even if a route forgets requireTenantAccess, the DB only returns push tokens for tenants the caller belongs to (via tenant_users) or is_mbg_admin().';

COMMENT ON POLICY analytics_events_admin_read ON analytics_events IS
  'Defense-in-depth: replaces the prior `USING (true)` allow-all policy. Authenticated users see only tenants they belong to; service role (mobile ingest) bypasses RLS.';

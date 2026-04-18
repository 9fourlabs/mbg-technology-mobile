-- ============================================================================
-- Migration 015: Tenant users (client portal foundation)
-- ============================================================================
--
-- Lets a Supabase auth user own one or more tenants. MBG staff get role
-- 'admin' (and see every tenant); client users get role 'client' and are
-- scoped to the rows where their user_id appears in tenant_users.
--
-- Applies to the ADMIN database (the one that hosts the `tenants`, `builds`,
-- and `activity_log` tables). NOT applied to per-tenant Supabase projects.
--
-- Intentionally permissive on writes for MBG admins; clients get read-only
-- access to the tenants table from this migration. Tenant-content writes go
-- through API routes that connect to the tenant's own Supabase project with
-- a service-role key — see admin/src/lib/supabase/tenant.ts.

-- ---------------------------------------------------------------------------
-- tenant_users: many-to-many link between auth.users and tenants, with role
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_id   TEXT        NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('admin', 'client')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users (user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users (tenant_id);

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: is the current user an MBG admin?
-- ---------------------------------------------------------------------------
-- An MBG admin is a user that has at least one tenant_users row with role='admin'.
-- For convenience we also treat anyone in app_metadata.role='admin' as admin —
-- this lets bootstrapping happen via the Supabase dashboard before the first
-- tenant_users row exists.
CREATE OR REPLACE FUNCTION is_mbg_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR EXISTS (
      SELECT 1 FROM tenant_users
      WHERE user_id = auth.uid() AND role = 'admin'
    );
$$;

-- ---------------------------------------------------------------------------
-- RLS: tenant_users
-- ---------------------------------------------------------------------------
-- Users can see their own membership rows. Admins can see all.
CREATE POLICY "tenant_users_select_own_or_admin"
  ON tenant_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_mbg_admin());

-- Only MBG admins can grant/revoke memberships.
CREATE POLICY "tenant_users_write_admin_only"
  ON tenant_users FOR ALL
  TO authenticated
  USING (is_mbg_admin())
  WITH CHECK (is_mbg_admin());

-- ---------------------------------------------------------------------------
-- Update tenants table policies: clients can read tenants they belong to
-- ---------------------------------------------------------------------------
-- The original policy granted `auth.role() = 'authenticated'` full access
-- (any logged-in user could touch any tenant). Replace with role-aware policies.

DROP POLICY IF EXISTS "Admin full access to tenants" ON tenants;

CREATE POLICY "tenants_admin_all"
  ON tenants FOR ALL
  TO authenticated
  USING (is_mbg_admin())
  WITH CHECK (is_mbg_admin());

CREATE POLICY "tenants_client_read_own"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
        AND tenant_users.tenant_id = tenants.id
    )
  );

-- ---------------------------------------------------------------------------
-- Update builds and activity_log: client read-only on owned tenants
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin full access to builds" ON builds;

CREATE POLICY "builds_admin_all"
  ON builds FOR ALL
  TO authenticated
  USING (is_mbg_admin())
  WITH CHECK (is_mbg_admin());

CREATE POLICY "builds_client_read_own"
  ON builds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
        AND tenant_users.tenant_id = builds.tenant_id
    )
  );

DROP POLICY IF EXISTS "Admin full access to activity_log" ON activity_log;

CREATE POLICY "activity_log_admin_all"
  ON activity_log FOR ALL
  TO authenticated
  USING (is_mbg_admin())
  WITH CHECK (is_mbg_admin());

CREATE POLICY "activity_log_client_read_own"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
        AND tenant_users.tenant_id = activity_log.tenant_id
    )
  );

-- ---------------------------------------------------------------------------
-- Seed: bootstrap admin role from env-provided user
-- ---------------------------------------------------------------------------
-- After running this migration, manually grant admin to your MBG team:
--
--   INSERT INTO tenant_users (user_id, tenant_id, role)
--   SELECT id, 'mbg', 'admin'
--   FROM auth.users
--   WHERE email IN ('you@mbgtechnology.com', 'teammate@mbgtechnology.com');
--
-- Or set app_metadata.role='admin' on the user via the Supabase dashboard
-- (Authentication → Users → click user → Raw User App Meta Data).

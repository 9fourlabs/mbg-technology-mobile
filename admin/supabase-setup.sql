-- Tenants table (stores tenant records managed by admin panel)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  business_name TEXT,
  template_type TEXT NOT NULL DEFAULT 'informational',
  status TEXT NOT NULL DEFAULT 'draft',
  config JSONB NOT NULL DEFAULT '{}',
  supabase_project_id TEXT,
  supabase_url TEXT,
  expo_project_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Builds table (tracks EAS builds)
CREATE TABLE IF NOT EXISTS builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  workflow_run_id TEXT,
  platform TEXT,
  profile TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  build_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity log table (tracks actions on tenants)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  action TEXT NOT NULL,
  details TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admin) full access
CREATE POLICY "Admin full access to tenants" ON tenants
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to builds" ON builds
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin full access to activity_log" ON activity_log
  FOR ALL USING (auth.role() = 'authenticated');

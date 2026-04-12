-- Reconcile schema: ensure all columns referenced by admin code exist
-- Tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS supabase_anon_key TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS app_version TEXT DEFAULT '1.0.0';

-- Builds
ALTER TABLE builds ADD COLUMN IF NOT EXISTS app_version TEXT;
ALTER TABLE builds ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE builds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

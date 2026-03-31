-- Add custom app support columns to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS app_type TEXT DEFAULT 'template';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS repo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS repo_branch TEXT DEFAULT 'main';

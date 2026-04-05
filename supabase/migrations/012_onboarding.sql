-- Onboarding progress tracking
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_progress JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

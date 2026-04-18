-- ============================================================================
-- Migration 017: Tenant brief (intake metadata)
-- ============================================================================
--
-- Captures the structured client intake collected during the new-tenant
-- wizard. Lets MBG keep the "why we built this" alongside the "what we built"
-- without scattering it across email threads.
--
-- Applies to the ADMIN database only.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS brief JSONB NOT NULL DEFAULT '{}';

-- Expected shape (free-form so we can iterate without migrations):
--   {
--     "industry": "dentistry",
--     "primaryContactName": "Jane Smith",
--     "primaryContactEmail": "jane@acmedental.com",
--     "primaryGoal": "let patients book and view records",
--     "specialRequirements": "HIPAA-compliant document storage",
--     "targetLaunchDate": "2026-06-01"
--   }
COMMENT ON COLUMN tenants.brief IS
  'Free-form intake metadata captured during tenant creation. See docs/INTAKE.md.';

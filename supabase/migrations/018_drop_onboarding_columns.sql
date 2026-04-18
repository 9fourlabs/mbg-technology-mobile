-- ============================================================================
-- Migration 018: Drop unused onboarding columns
-- ============================================================================
--
-- Migration 012 added `onboarding_progress` JSONB and `onboarding_completed_at`
-- TIMESTAMPTZ to the tenants table, intending to track explicit onboarding
-- progress. In practice the admin detail page derives onboarding state from
-- concrete signals (brand set? logo uploaded? preview build completed?) — see
-- admin/src/app/(auth)/tenants/[id]/page.tsx.
--
-- The columns were never read or written, so we're removing them to keep the
-- schema honest. If we later want explicit persistence, prefer a separate
-- `onboarding_events` append-only log over a JSONB blob.

ALTER TABLE tenants DROP COLUMN IF EXISTS onboarding_progress;
ALTER TABLE tenants DROP COLUMN IF EXISTS onboarding_completed_at;

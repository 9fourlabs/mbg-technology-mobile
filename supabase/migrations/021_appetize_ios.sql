-- Dual-platform Appetize preview support.
--
-- builds.appetize_public_key   — Android app (existing; migration 013)
-- builds.appetize_public_key_ios — iOS simulator app (new)
-- tenants.appetize_public_key_ios — tenant-level reuse (so re-uploads keep
--                                   the same embed URL, parallel to existing
--                                   tenants.appetize_public_key for Android)

ALTER TABLE builds  ADD COLUMN IF NOT EXISTS appetize_public_key_ios TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS appetize_public_key_ios TEXT;

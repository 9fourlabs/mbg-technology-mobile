-- Appetize.io integration: store public keys for browser-based app previews
ALTER TABLE builds ADD COLUMN IF NOT EXISTS appetize_public_key TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS appetize_public_key TEXT;

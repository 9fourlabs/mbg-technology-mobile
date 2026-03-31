ALTER TABLE builds ADD COLUMN IF NOT EXISTS eas_build_id_android TEXT;
ALTER TABLE builds ADD COLUMN IF NOT EXISTS eas_build_id_ios TEXT;

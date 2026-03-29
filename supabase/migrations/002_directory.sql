-- ============================================================================
-- Migration 002: Directory Template
-- Table for location/business directory listings
-- ============================================================================

CREATE TABLE directory_items (
  id          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT             NOT NULL,
  category_id TEXT,
  data        JSONB            NOT NULL DEFAULT '{}',
  image_url   TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  active      BOOLEAN          NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX idx_directory_items_category_id ON directory_items (category_id);
CREATE INDEX idx_directory_items_name ON directory_items (name);
CREATE INDEX idx_directory_items_data ON directory_items USING GIN (data);

ALTER TABLE directory_items ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active directory items
CREATE POLICY "directory_items_select_active"
  ON directory_items FOR SELECT
  TO authenticated
  USING (active = true);

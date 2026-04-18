-- ============================================================================
-- Migration 016: Events (calendar)
-- ============================================================================
--
-- Per-tenant events table for client-managed event calendars. Applies to each
-- tenant's own Supabase project (mirrors the per-tenant scope of posts,
-- directory_items, etc.).
--
-- The mobile app reads this via a future `EventsTab` rendering — for now,
-- the table is populated and surfaced via the admin/client portal only.

CREATE TABLE IF NOT EXISTS events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ,
  location      TEXT,
  image_url     TEXT,
  rsvp_url      TEXT,
  category      TEXT,
  published     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (starts_at);
CREATE INDEX IF NOT EXISTS idx_events_published_starts ON events (published, starts_at);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- End-users (mobile app) can read published, current-or-future events.
CREATE POLICY "events_select_published"
  ON events FOR SELECT
  TO authenticated
  USING (published = true);

-- Public unauthenticated reads (e.g. share preview links). Tenant projects
-- decide whether to enable this; it mirrors the posts policy.
CREATE POLICY "events_select_public_published"
  ON events FOR SELECT
  TO anon
  USING (published = true);

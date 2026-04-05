-- Analytics event tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  anonymous_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB,
  screen_name TEXT,
  platform TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant_date ON analytics_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(tenant_id, event_name);

-- RLS: service role can insert (via API from mobile), admin can select
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON analytics_events
  FOR ALL USING (true) WITH CHECK (true);

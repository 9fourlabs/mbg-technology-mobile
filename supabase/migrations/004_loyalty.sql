-- ============================================================================
-- Migration 004: Loyalty Template
-- Tables for points-based loyalty program with tiered accounts
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Loyalty Accounts (one per user)
-- ---------------------------------------------------------------------------
CREATE TABLE loyalty_accounts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users (id) UNIQUE,
  points_balance  INT         NOT NULL DEFAULT 0,
  lifetime_points INT         NOT NULL DEFAULT 0,
  tier            TEXT        NOT NULL DEFAULT 'bronze',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_accounts_user_id ON loyalty_accounts (user_id);

ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view only their own account
CREATE POLICY "loyalty_accounts_select_own"
  ON loyalty_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Loyalty Transactions
-- ---------------------------------------------------------------------------
CREATE TABLE loyalty_transactions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users (id),
  type         TEXT        NOT NULL
                           CHECK (type IN ('earn', 'redeem', 'adjustment', 'expire')),
  points       INT         NOT NULL,
  description  TEXT,
  reference_id TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_transactions_user_date ON loyalty_transactions (user_id, created_at DESC);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view only their own transactions
CREATE POLICY "loyalty_transactions_select_own"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Loyalty Rewards (catalogue)
-- ---------------------------------------------------------------------------
CREATE TABLE loyalty_rewards (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  points_cost INT         NOT NULL,
  image_url   TEXT,
  active      BOOLEAN     NOT NULL DEFAULT true,
  stock       INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Authenticated users can browse active rewards
CREATE POLICY "loyalty_rewards_select_active"
  ON loyalty_rewards FOR SELECT
  TO authenticated
  USING (active = true);

-- ============================================================================
-- Migration 006: Commerce Template
-- Tables for product catalogue, orders, and order items
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  image_url  TEXT,
  sort_order INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Authenticated users can browse categories
CREATE POLICY "categories_select"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT          NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  image_url   TEXT,
  category_id UUID          REFERENCES categories (id),
  active      BOOLEAN       NOT NULL DEFAULT true,
  stock       INT           NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category_id ON products (category_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Authenticated users can browse active products
CREATE POLICY "products_select_active"
  ON products FOR SELECT
  TO authenticated
  USING (active = true);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
  id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID          NOT NULL REFERENCES auth.users (id),
  status                   TEXT          NOT NULL DEFAULT 'pending'
                                         CHECK (status IN (
                                           'pending', 'paid', 'processing',
                                           'shipped', 'delivered', 'cancelled', 'refunded'
                                         )),
  subtotal                 DECIMAL(10,2) NOT NULL,
  tax                      DECIMAL(10,2) NOT NULL DEFAULT 0,
  total                    DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  shipping_address         JSONB,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user_date ON orders (user_id, created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can manage only their own orders
CREATE POLICY "orders_all_own"
  ON orders FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Order Items
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID          NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id UUID          NOT NULL REFERENCES products (id),
  quantity   INT           NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can view items belonging to their own orders
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

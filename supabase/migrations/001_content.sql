-- ============================================================================
-- Migration 001: Content Template
-- Tables for blog/article content with bookmarking support
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
CREATE TABLE posts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  slug         TEXT        NOT NULL UNIQUE,
  excerpt      TEXT,
  body         TEXT,
  image_url    TEXT,
  category_id  TEXT,
  published    BOOLEAN     NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_category_id ON posts (category_id);
CREATE INDEX idx_posts_published_date ON posts (published, published_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read published posts
CREATE POLICY "posts_select_published"
  ON posts FOR SELECT
  TO authenticated
  USING (published = true);

-- ---------------------------------------------------------------------------
-- Bookmarks
-- ---------------------------------------------------------------------------
CREATE TABLE bookmarks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users (id),
  post_id    UUID        NOT NULL REFERENCES posts (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks (user_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can manage only their own bookmarks
CREATE POLICY "bookmarks_all_own"
  ON bookmarks FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

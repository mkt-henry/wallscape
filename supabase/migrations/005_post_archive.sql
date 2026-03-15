-- ============================================================
-- Post Archive Feature
-- ============================================================

ALTER TABLE posts
  ADD COLUMN status TEXT NOT NULL DEFAULT 'public'
    CHECK (status IN ('public', 'archived')),
  ADD COLUMN archived_at TIMESTAMPTZ;

CREATE INDEX idx_posts_status ON posts(status);

-- ============================================================
-- 008: Artists (is_verified) + Community board
-- ============================================================

-- ── 1. Add is_verified to profiles ──────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_verified
  ON profiles (is_verified) WHERE is_verified = TRUE;

-- ── 2. Community board tables ───────────────────────────────

-- Board posts (게시판 글)
CREATE TABLE IF NOT EXISTS board_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_posts_created ON board_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_posts_category ON board_posts (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_posts_user ON board_posts (user_id);

-- Board comments (게시판 댓글)
CREATE TABLE IF NOT EXISTS board_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_post_id UUID NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_comments_post ON board_comments (board_post_id, created_at ASC);

-- ── 3. RLS policies ─────────────────────────────────────────

ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_comments ENABLE ROW LEVEL SECURITY;

-- board_posts: anyone can read
CREATE POLICY "board_posts_select" ON board_posts
  FOR SELECT USING (true);

-- board_posts: authenticated users can insert their own
CREATE POLICY "board_posts_insert" ON board_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- board_posts: users can update/delete their own
CREATE POLICY "board_posts_update" ON board_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "board_posts_delete" ON board_posts
  FOR DELETE USING (auth.uid() = user_id);

-- board_comments: anyone can read
CREATE POLICY "board_comments_select" ON board_comments
  FOR SELECT USING (true);

-- board_comments: authenticated users can insert their own
CREATE POLICY "board_comments_insert" ON board_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- board_comments: users can update/delete their own
CREATE POLICY "board_comments_update" ON board_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "board_comments_delete" ON board_comments
  FOR DELETE USING (auth.uid() = user_id);

-- ── 4. Updated_at trigger for board tables ──────────────────

CREATE OR REPLACE FUNCTION update_board_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_board_posts_updated_at
  BEFORE UPDATE ON board_posts
  FOR EACH ROW EXECUTE FUNCTION update_board_updated_at();

CREATE TRIGGER trg_board_comments_updated_at
  BEFORE UPDATE ON board_comments
  FOR EACH ROW EXECUTE FUNCTION update_board_updated_at();

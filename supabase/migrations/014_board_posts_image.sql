-- ============================================================
-- 014: Add image_url to board_posts
-- ============================================================

ALTER TABLE board_posts
  ADD COLUMN IF NOT EXISTS image_url TEXT;

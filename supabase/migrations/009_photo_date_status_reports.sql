-- ============================================================
-- 009: Photo taken date + Status reports (still there / gone)
-- ============================================================

-- ── 1. Add photo_taken_at to posts ──────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS photo_taken_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS still_there_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gone_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_confirmed_at TIMESTAMPTZ;

-- ── 2. Status reports table ─────────────────────────────────

CREATE TABLE IF NOT EXISTS status_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('still_there', 'gone')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One active report per user per post
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_status_reports_post ON status_reports (post_id, created_at DESC);

-- ── 3. RLS policies ─────────────────────────────────────────

ALTER TABLE status_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "status_reports_select" ON status_reports
  FOR SELECT USING (true);

CREATE POLICY "status_reports_insert" ON status_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "status_reports_update" ON status_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "status_reports_delete" ON status_reports
  FOR DELETE USING (auth.uid() = user_id);

-- ── 4. Update get_nearby_posts to include new fields ────────

DROP FUNCTION IF EXISTS get_nearby_posts(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, INTEGER, UUID);

CREATE OR REPLACE FUNCTION get_nearby_posts(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000,
  post_limit INTEGER DEFAULT 20,
  cursor_val UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  image_url TEXT,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[],
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  city TEXT,
  district TEXT,
  like_count INTEGER,
  comment_count INTEGER,
  bookmark_count INTEGER,
  view_count INTEGER,
  visibility TEXT,
  show_in_profile BOOLEAN,
  show_in_feed BOOLEAN,
  show_in_map BOOLEAN,
  photo_taken_at TIMESTAMPTZ,
  still_there_count INTEGER,
  gone_count INTEGER,
  last_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION,
  profiles JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.user_id, p.image_url, p.thumbnail_url,
    p.title, p.description, p.tags,
    p.lat, p.lng, p.address, p.city, p.district,
    p.like_count, p.comment_count, p.bookmark_count, p.view_count,
    p.visibility::TEXT, p.show_in_profile, p.show_in_feed, p.show_in_map,
    p.photo_taken_at, p.still_there_count, p.gone_count, p.last_confirmed_at,
    p.created_at, p.updated_at,
    earth_distance(
      ll_to_earth(user_lat, user_lng),
      ll_to_earth(p.lat, p.lng)
    ) AS distance_meters,
    jsonb_build_object(
      'id', pr.id,
      'username', pr.username,
      'display_name', pr.display_name,
      'avatar_url', pr.avatar_url
    ) AS profiles
  FROM posts p
  JOIN profiles pr ON pr.id = p.user_id
  WHERE p.visibility = 'public'
    AND p.show_in_map = TRUE
    AND earth_distance(
      ll_to_earth(user_lat, user_lng),
      ll_to_earth(p.lat, p.lng)
    ) <= radius_meters
    AND (cursor_val IS NULL OR p.id < cursor_val)
  ORDER BY distance_meters ASC
  LIMIT post_limit;
END;
$$ LANGUAGE plpgsql STABLE;

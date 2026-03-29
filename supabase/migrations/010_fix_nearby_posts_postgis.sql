-- ============================================================
-- 010: Fix get_nearby_posts — use PostGIS instead of earthdistance
--
-- Migration 009 switched to earth_distance/ll_to_earth which
-- require the cube + earthdistance extensions (not enabled).
-- Revert to PostGIS ST_DWithin / ST_Distance which are already
-- available and leverage the GIST index on posts.location.
-- ============================================================

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
    ST_Distance(
      p.location::GEOGRAPHY,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::GEOGRAPHY
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
    AND ST_DWithin(
      p.location::GEOGRAPHY,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::GEOGRAPHY,
      radius_meters
    )
    AND (cursor_val IS NULL OR p.id < cursor_val)
  ORDER BY distance_meters ASC
  LIMIT post_limit;
END;
$$ LANGUAGE plpgsql STABLE;

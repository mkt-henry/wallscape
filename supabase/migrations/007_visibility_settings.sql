-- ============================================================
-- Migration: 007 — granular visibility settings per post
-- Adds three boolean flags that control WHERE a post appears.
-- ============================================================

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS show_in_profile BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_in_feed    BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_in_map     BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================================
-- Update get_nearby_posts to respect show_in_map flag
-- Must DROP first because return type changed (added new columns)
-- ============================================================
DROP FUNCTION IF EXISTS get_nearby_posts(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, INTEGER, UUID);

CREATE OR REPLACE FUNCTION get_nearby_posts(
  user_lat        DOUBLE PRECISION,
  user_lng        DOUBLE PRECISION,
  radius_meters   INTEGER DEFAULT 5000,
  post_limit      INTEGER DEFAULT 50,
  cursor_val      UUID DEFAULT NULL
)
RETURNS TABLE (
  id             UUID,
  user_id        UUID,
  image_url      TEXT,
  thumbnail_url  TEXT,
  title          TEXT,
  description    TEXT,
  tags           TEXT[],
  lat            DOUBLE PRECISION,
  lng            DOUBLE PRECISION,
  address        TEXT,
  city           TEXT,
  district       TEXT,
  like_count     INTEGER,
  comment_count  INTEGER,
  bookmark_count INTEGER,
  view_count     INTEGER,
  visibility     post_visibility,
  show_in_profile BOOLEAN,
  show_in_feed   BOOLEAN,
  show_in_map    BOOLEAN,
  created_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION,
  profiles       JSON
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.image_url,
    p.thumbnail_url,
    p.title,
    p.description,
    p.tags,
    p.lat,
    p.lng,
    p.address,
    p.city,
    p.district,
    p.like_count,
    p.comment_count,
    p.bookmark_count,
    p.view_count,
    p.visibility,
    p.show_in_profile,
    p.show_in_feed,
    p.show_in_map,
    p.created_at,
    p.updated_at,
    ST_Distance(
      p.location::GEOGRAPHY,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::GEOGRAPHY
    ) AS distance_meters,
    row_to_json(pr.*) AS profiles
  FROM posts p
  JOIN profiles pr ON pr.id = p.user_id
  WHERE
    p.visibility = 'public'
    AND p.show_in_map = TRUE
    AND ST_DWithin(
      p.location::GEOGRAPHY,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::GEOGRAPHY,
      radius_meters
    )
    AND (cursor_val IS NULL OR p.id > cursor_val)
  ORDER BY distance_meters ASC
  LIMIT post_limit;
END;
$$;

-- ============================================================
-- Wallscape - Initial Database Schema
-- Run this in Supabase SQL Editor or via supabase db push
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy text search

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  website      TEXT,
  location     TEXT,
  post_count        INTEGER NOT NULL DEFAULT 0,
  follower_count    INTEGER NOT NULL DEFAULT 0,
  following_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 20),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 300)
);

-- Index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- ============================================================
-- POSTS TABLE
-- ============================================================
CREATE TYPE post_visibility AS ENUM ('public', 'followers', 'private');

CREATE TABLE posts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url      TEXT NOT NULL,
  thumbnail_url  TEXT,
  title          TEXT NOT NULL,
  description    TEXT,
  tags           TEXT[] NOT NULL DEFAULT '{}',
  -- Spatial data (WGS84)
  lat            DOUBLE PRECISION NOT NULL,
  lng            DOUBLE PRECISION NOT NULL,
  location       GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                   ST_SetSRID(ST_MakePoint(lng, lat), 4326)
                 ) STORED,
  address        TEXT,
  city           TEXT,
  district       TEXT,
  -- Counters (denormalized for performance)
  like_count     INTEGER NOT NULL DEFAULT 0,
  comment_count  INTEGER NOT NULL DEFAULT 0,
  bookmark_count INTEGER NOT NULL DEFAULT 0,
  view_count     INTEGER NOT NULL DEFAULT 0,
  visibility     post_visibility NOT NULL DEFAULT 'public',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 60),
  CONSTRAINT description_length CHECK (char_length(description) <= 500),
  CONSTRAINT lat_range CHECK (lat BETWEEN -90 AND 90),
  CONSTRAINT lng_range CHECK (lng BETWEEN -180 AND 180)
);

-- Spatial index for nearby queries
CREATE INDEX idx_posts_location ON posts USING GIST(location);
-- Regular indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_like_count ON posts(like_count DESC);
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
-- Full text search
CREATE INDEX idx_posts_title_trgm ON posts USING GIN(title gin_trgm_ops);

-- ============================================================
-- COMMENTS TABLE
-- ============================================================
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT content_length CHECK (char_length(content) BETWEEN 1 AND 500)
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- ============================================================
-- LIKES TABLE
-- ============================================================
CREATE TABLE likes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT one_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);

-- ============================================================
-- BOOKMARKS TABLE
-- ============================================================
CREATE TABLE bookmarks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id);

-- ============================================================
-- FOLLOWS TABLE
-- ============================================================
CREATE TABLE follows (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TYPE notification_type AS ENUM (
  'like_post',
  'like_comment',
  'comment',
  'reply',
  'follow',
  'mention',
  'nearby_post'
);

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  message    TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Sanitize: keep only alphanumeric and underscore, limit to 20 chars
  base_username := LOWER(REGEXP_REPLACE(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  base_username := LEFT(base_username, 20);

  -- Ensure minimum length
  IF char_length(base_username) < 3 THEN
    base_username := 'user' || base_username;
  END IF;

  final_username := base_username;

  -- Handle username conflicts
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := LEFT(base_username, 17) || counter::TEXT;
  END LOOP;

  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- TRIGGER: Update post_count on profiles
-- ============================================================
CREATE OR REPLACE FUNCTION update_post_count()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET post_count = post_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_post_change
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE PROCEDURE update_post_count();

-- ============================================================
-- TRIGGER: Update like_count on posts
-- ============================================================
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE PROCEDURE update_like_count();

-- ============================================================
-- TRIGGER: Update comment_count on posts
-- ============================================================
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE PROCEDURE update_comment_count();

-- ============================================================
-- TRIGGER: Update follower/following counts
-- ============================================================
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET follower_count  = follower_count  + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET follower_count  = GREATEST(0, follower_count  - 1) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE PROCEDURE update_follow_counts();

-- ============================================================
-- TRIGGER: Auto-create notifications
-- ============================================================
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'likes' AND NEW.post_id IS NOT NULL THEN
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    IF post_owner_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, actor_id, type, post_id)
      VALUES (post_owner_id, NEW.user_id, 'like_post', NEW.post_id)
      ON CONFLICT DO NOTHING;
    END IF;

  ELSIF TG_TABLE_NAME = 'comments' THEN
    SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
    IF post_owner_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id, message)
      VALUES (post_owner_id, NEW.user_id, 'comment', NEW.post_id, NEW.id, LEFT(NEW.content, 100));
    END IF;

  ELSIF TG_TABLE_NAME = 'follows' THEN
    INSERT INTO notifications (user_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE PROCEDURE create_notification();

CREATE TRIGGER on_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE PROCEDURE create_notification();

CREATE TRIGGER on_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE PROCEDURE create_notification();

-- ============================================================
-- FUNCTION: Get nearby posts (spatial query)
-- ============================================================
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

-- ============================================================
-- FUNCTION: Search tags
-- ============================================================
CREATE OR REPLACE FUNCTION search_tags(search_term TEXT)
RETURNS TABLE (tag TEXT, post_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    unnested_tag AS tag,
    COUNT(*) AS post_count
  FROM (
    SELECT UNNEST(tags) AS unnested_tag
    FROM posts
    WHERE visibility = 'public'
  ) t
  WHERE unnested_tag ILIKE '%' || search_term || '%'
  GROUP BY unnested_tag
  ORDER BY post_count DESC
  LIMIT 20;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES policies ----
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ---- POSTS policies ----
CREATE POLICY "Public posts are readable by all"
  ON posts FOR SELECT USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (
      visibility = 'followers'
      AND EXISTS (
        SELECT 1 FROM follows
        WHERE follower_id = auth.uid()
        AND following_id = posts.user_id
      )
    )
  );

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- ---- COMMENTS policies ----
CREATE POLICY "Comments on public posts are readable"
  ON comments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
        AND (posts.visibility = 'public' OR posts.user_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can comment"
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM posts WHERE id = post_id AND user_id = auth.uid())
  );

-- ---- LIKES policies ----
CREATE POLICY "Likes are publicly readable"
  ON likes FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can like"
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
  ON likes FOR DELETE USING (auth.uid() = user_id);

-- ---- BOOKMARKS policies ----
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can bookmark"
  ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks"
  ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ---- FOLLOWS policies ----
CREATE POLICY "Follows are publicly readable"
  ON follows FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can follow"
  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ---- NOTIFICATIONS policies ----
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- UPDATED_AT trigger utility
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

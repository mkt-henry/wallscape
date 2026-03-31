-- Add tagged_artist_ids to posts for artist tagging feature
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tagged_artist_ids UUID[] DEFAULT '{}';

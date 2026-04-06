-- Add graffiti_type column to posts (tagging, bombing, mural, other)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS graffiti_type TEXT DEFAULT 'other';

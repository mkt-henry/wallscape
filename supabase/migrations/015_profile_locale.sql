-- Add preferred locale to profiles
ALTER TABLE profiles ADD COLUMN preferred_locale TEXT NOT NULL DEFAULT 'ko';

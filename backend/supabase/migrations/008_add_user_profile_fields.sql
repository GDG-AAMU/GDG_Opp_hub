-- Migration: Add user profile fields
-- Created: 2025-11-20
-- Description: Adds profile fields (avatar, birthday, location, gender) to users table
-- These fields are used in the settings and profile pages

-- Add profile fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other') OR gender IS NULL),
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile picture (stored in Supabase Storage)';
COMMENT ON COLUMN users.birthday IS 'User date of birth';
COMMENT ON COLUMN users.country IS 'User country';
COMMENT ON COLUMN users.gender IS 'User gender (male, female, other)';
COMMENT ON COLUMN users.region IS 'User region/continent';
COMMENT ON COLUMN users.state IS 'User state/province';

-- Create index on avatar_url for faster lookups (if needed)
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url) WHERE avatar_url IS NOT NULL;


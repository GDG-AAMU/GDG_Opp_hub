-- Migration: Logo Verification System
-- Description: Adds logo storage, verification, and domain mapping capabilities
-- Author: GDG Opportunities Platform
-- Date: 2025-01-18

-- ============================================================================
-- 1. Extend opportunities table with logo fields
-- ============================================================================

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS logo_source TEXT CHECK (logo_source IN ('brandfetch', 'duckduckgo', 'google', 'manual', NULL)),
  ADD COLUMN IF NOT EXISTS logo_last_updated TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS logo_verification_flags INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN opportunities.logo_url IS 'Cached URL or path to company logo';
COMMENT ON COLUMN opportunities.logo_verified IS 'Whether logo has been manually verified by admin';
COMMENT ON COLUMN opportunities.logo_source IS 'Source of the logo (brandfetch, duckduckgo, google, manual)';
COMMENT ON COLUMN opportunities.logo_last_updated IS 'Timestamp of last logo update or verification';
COMMENT ON COLUMN opportunities.logo_verification_flags IS 'Number of times users have flagged this logo as incorrect';

-- ============================================================================
-- 2. Create domain_mappings table for manual domain overrides
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_pattern TEXT UNIQUE NOT NULL,
  target_domain TEXT NOT NULL,
  mapping_type TEXT DEFAULT 'manual' CHECK (mapping_type IN ('manual', 'auto', 'community')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_domain_mappings_source ON domain_mappings(source_pattern);
CREATE INDEX IF NOT EXISTS idx_domain_mappings_target ON domain_mappings(target_domain);

-- Add comments
COMMENT ON TABLE domain_mappings IS 'Maps subdomain URLs to root domains for logo fetching (e.g., careers.google.com -> google.com)';
COMMENT ON COLUMN domain_mappings.source_pattern IS 'The subdomain pattern to match (e.g., careers.google.com)';
COMMENT ON COLUMN domain_mappings.target_domain IS 'The root domain to use for logo (e.g., google.com)';
COMMENT ON COLUMN domain_mappings.mapping_type IS 'How the mapping was created (manual by admin, auto-detected, or community-suggested)';
COMMENT ON COLUMN domain_mappings.verified_count IS 'Number of times this mapping has been used successfully';

-- ============================================================================
-- 3. Create logo_assets table for manually uploaded logos
-- ============================================================================

CREATE TABLE IF NOT EXISTS logo_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT UNIQUE NOT NULL,
  storage_path TEXT NOT NULL,
  file_format TEXT CHECK (file_format IN ('png', 'svg', 'jpg', 'jpeg', 'webp')),
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_logo_assets_domain ON logo_assets(domain);

-- Add comments
COMMENT ON TABLE logo_assets IS 'Stores metadata for manually uploaded company logos in Supabase Storage';
COMMENT ON COLUMN logo_assets.storage_path IS 'Path in Supabase Storage bucket (e.g., logos/google.png)';
COMMENT ON COLUMN logo_assets.file_format IS 'Image format (png, svg, jpg, etc.)';

-- ============================================================================
-- 4. Create function to update logo_last_updated timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_logo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND (
    NEW.logo_url IS DISTINCT FROM OLD.logo_url OR
    NEW.logo_verified IS DISTINCT FROM OLD.logo_verified
  )) THEN
    NEW.logo_last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
DROP TRIGGER IF EXISTS trigger_update_logo_timestamp ON opportunities;
CREATE TRIGGER trigger_update_logo_timestamp
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_logo_timestamp();

-- ============================================================================
-- 5. Create function to increment domain mapping verified_count
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_mapping_verified_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.logo_verified = true AND OLD.logo_verified = false THEN
    -- Increment the verified_count for any matching domain mappings
    UPDATE domain_mappings
    SET verified_count = verified_count + 1,
        updated_at = NOW()
    WHERE source_pattern IN (
      SELECT DISTINCT substring(url FROM '(?:https?://)?(?:www\.)?([^/]+)')
      FROM opportunities
      WHERE id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
DROP TRIGGER IF EXISTS trigger_increment_mapping_count ON opportunities;
CREATE TRIGGER trigger_increment_mapping_count
  AFTER UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION increment_mapping_verified_count();

-- ============================================================================
-- 6. Insert common domain mappings (seed data)
-- ============================================================================

INSERT INTO domain_mappings (source_pattern, target_domain, mapping_type) VALUES
  ('careers.google.com', 'google.com', 'auto'),
  ('jobs.apple.com', 'apple.com', 'auto'),
  ('careers.microsoft.com', 'microsoft.com', 'auto'),
  ('jobs.netflix.com', 'netflix.com', 'auto'),
  ('careers.amazon.com', 'amazon.com', 'auto'),
  ('jobs.meta.com', 'meta.com', 'auto'),
  ('careers.fb.com', 'meta.com', 'auto'),
  ('jobs.walmart.com', 'walmart.com', 'auto'),
  ('careers.salesforce.com', 'salesforce.com', 'auto'),
  ('jobs.oracle.com', 'oracle.com', 'auto')
ON CONFLICT (source_pattern) DO NOTHING;

-- ============================================================================
-- 7. Add RLS policies for logo-related tables
-- ============================================================================

-- Enable RLS
ALTER TABLE domain_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE logo_assets ENABLE ROW LEVEL SECURITY;

-- Domain mappings: Everyone can read, only admins can modify
DROP POLICY IF EXISTS "Domain mappings are viewable by everyone" ON domain_mappings;
CREATE POLICY "Domain mappings are viewable by everyone"
  ON domain_mappings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Domain mappings can be created by admins" ON domain_mappings;
CREATE POLICY "Domain mappings can be created by admins"
  ON domain_mappings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Domain mappings can be updated by admins" ON domain_mappings;
CREATE POLICY "Domain mappings can be updated by admins"
  ON domain_mappings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Logo assets: Everyone can read, only admins can modify
DROP POLICY IF EXISTS "Logo assets are viewable by everyone" ON logo_assets;
CREATE POLICY "Logo assets are viewable by everyone"
  ON logo_assets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Logo assets can be uploaded by admins" ON logo_assets;
CREATE POLICY "Logo assets can be uploaded by admins"
  ON logo_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 8. Create indexes on opportunities logo fields for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_opportunities_logo_verified ON opportunities(logo_verified);
CREATE INDEX IF NOT EXISTS idx_opportunities_logo_source ON opportunities(logo_source);
CREATE INDEX IF NOT EXISTS idx_opportunities_logo_flags ON opportunities(logo_verification_flags) WHERE logo_verification_flags > 0;

-- ============================================================================
-- Migration complete
-- ============================================================================

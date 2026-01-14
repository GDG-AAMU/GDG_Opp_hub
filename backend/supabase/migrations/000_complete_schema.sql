
-- ============================================================================
-- MIGRATION 001: Initial Schema
-- ============================================================================
-- Creates base tables, enums, RLS policies, and triggers
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE opportunity_type AS ENUM ('internship', 'full_time', 'research', 'fellowship', 'scholarship');
CREATE TYPE opportunity_status AS ENUM ('active', 'expired');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  major TEXT,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities table
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  opportunity_type opportunity_type NOT NULL,
  role_type TEXT,
  relevant_majors JSONB DEFAULT '[]'::jsonb,
  deadline DATE,
  requirements TEXT,
  location TEXT,
  description TEXT,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status opportunity_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expired_at TIMESTAMP WITH TIME ZONE,
  ai_parsed_data JSONB
);

-- Create indexes
CREATE INDEX idx_opportunities_url ON opportunities(url);
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_type ON opportunities(opportunity_type);
CREATE INDEX idx_opportunities_role_type ON opportunities(role_type);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_opportunities_submitted_by ON opportunities(submitted_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Anyone can read user profiles (for displaying submitted_by names)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Opportunities table policies
-- Anyone authenticated can read all opportunities
CREATE POLICY "Opportunities are viewable by authenticated users" ON opportunities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can create opportunities
CREATE POLICY "Authenticated users can create opportunities" ON opportunities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = submitted_by);

-- Only admins can update opportunities
CREATE POLICY "Admins can update opportunities" ON opportunities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admins can delete opportunities
CREATE POLICY "Admins can delete opportunities" ON opportunities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create function to automatically create user record when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists in public.users table
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- Only insert if user doesn't exist
    INSERT INTO public.users (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
      'student'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Email already exists (shouldn't happen due to auth constraint, but handle it)
    RAISE WARNING 'User with email % already exists', NEW.email;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log any other errors but don't fail the auth signup
    RAISE WARNING 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function when new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- MIGRATION 002: Seed Test Data (OPTIONAL - SKIP FOR PRODUCTION)
-- ============================================================================
-- Uncomment the section below if you want to add test data
-- ============================================================================

/*
-- Test data insertion code would go here
-- See 002_seed_test_data.sql for the full seed data
-- This is typically skipped in production environments
*/

-- ============================================================================
-- MIGRATION 003: Email Notifications System
-- ============================================================================
-- Adds notification preferences to users table and creates email queue system
-- ============================================================================

-- Add notification preferences to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_digest_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deadline_reminders_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_digest_time TIME DEFAULT '18:00:00'::time,
ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMP WITH TIME ZONE;

-- Create email_queue table for queuing emails
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('daily_digest', 'deadline_reminder')),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('daily_digest', 'deadline_reminder')),
  subject TEXT NOT NULL,
  opportunity_ids JSONB DEFAULT '[]'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resend_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_for ON email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);

-- Create trigger to update updated_at for email_queue
CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage email queue (for cron jobs)
CREATE POLICY "Service role can manage email queue" ON email_queue
  FOR ALL USING (true);

-- RLS Policies for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage email logs
CREATE POLICY "Service role can manage email logs" ON email_logs
  FOR ALL USING (true);

-- ============================================================================
-- MIGRATION 004: User Opportunities Tracking
-- ============================================================================
-- Allows users to save and track applied opportunities
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('saved', 'applied')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_opportunities_user_id ON user_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_opportunities_status ON user_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_user_opportunities_opportunity_id ON user_opportunities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_user_opportunities_user_status ON user_opportunities(user_id, status);

-- Enable RLS
ALTER TABLE user_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own opportunity statuses"
  ON user_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own opportunity statuses"
  ON user_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own opportunity statuses"
  ON user_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own opportunity statuses"
  ON user_opportunities FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_opportunities_updated_at
  BEFORE UPDATE ON user_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 005: Logo Verification System
-- ============================================================================
-- Adds logo storage, verification, and domain mapping capabilities
-- ============================================================================

-- 1. Extend opportunities table with logo fields
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

-- 2. Create domain_mappings table for manual domain overrides
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

-- 3. Create logo_assets table for manually uploaded logos
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

-- 4. Create function to update logo_last_updated timestamp
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

-- 5. Create function to increment domain mapping verified_count
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

-- 6. Insert common domain mappings (seed data)
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

-- 7. Add RLS policies for logo-related tables
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

-- 8. Create indexes on opportunities logo fields for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_logo_verified ON opportunities(logo_verified);
CREATE INDEX IF NOT EXISTS idx_opportunities_logo_source ON opportunities(logo_source);
CREATE INDEX IF NOT EXISTS idx_opportunities_logo_flags ON opportunities(logo_verification_flags) WHERE logo_verification_flags > 0;

-- ============================================================================
-- MIGRATION 006: Sponsorship and Citizenship Fields
-- ============================================================================
-- Adds fields to track visa sponsorship availability and US citizenship requirements
-- ============================================================================

-- Add new columns to opportunities table with smart defaults
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS offers_sponsorship BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requires_us_citizenship BOOLEAN DEFAULT FALSE;

-- Update existing NULL values to use the defaults
UPDATE opportunities
SET offers_sponsorship = TRUE
WHERE offers_sponsorship IS NULL;

UPDATE opportunities
SET requires_us_citizenship = FALSE
WHERE requires_us_citizenship IS NULL;

-- Make columns NOT NULL now that we have defaults
ALTER TABLE opportunities
ALTER COLUMN offers_sponsorship SET NOT NULL,
ALTER COLUMN requires_us_citizenship SET NOT NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN opportunities.offers_sponsorship IS 'Indicates whether the opportunity offers visa sponsorship. TRUE = offers sponsorship (default), FALSE = does not offer sponsorship';
COMMENT ON COLUMN opportunities.requires_us_citizenship IS 'Indicates whether US citizenship is required. TRUE = requires citizenship, FALSE = not required (default)';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_opportunities_offers_sponsorship ON opportunities(offers_sponsorship);
CREATE INDEX IF NOT EXISTS idx_opportunities_requires_us_citizenship ON opportunities(requires_us_citizenship);

-- ============================================================================
-- MIGRATION 007: Feedback System
-- ============================================================================
-- Creates feedback table and enums for user feedback submissions
-- ============================================================================

-- Create feedback status enum
CREATE TYPE feedback_status AS ENUM ('new', 'in_progress', 'resolved');

-- Create feedback type enum
CREATE TYPE feedback_type AS ENUM ('bug', 'feature_request', 'general', 'other');

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if anonymous
  feedback_type feedback_type NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT, -- URL where feedback was submitted from
  status feedback_status NOT NULL DEFAULT 'new',
  admin_notes TEXT, -- Internal notes for admins
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who resolved it
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- Update trigger for updated_at
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE feedback IS 'User feedback submissions including bugs, feature requests, and general feedback';
COMMENT ON COLUMN feedback.user_id IS 'User who submitted the feedback. NULL for anonymous submissions';
COMMENT ON COLUMN feedback.feedback_type IS 'Type of feedback: bug, feature_request, general, or other';
COMMENT ON COLUMN feedback.status IS 'Current status: new, in_progress, or resolved';
COMMENT ON COLUMN feedback.resolved_by IS 'Admin user who marked the feedback as resolved';

-- Row Level Security (RLS)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert feedback (authenticated or anonymous)
CREATE POLICY "Anyone can submit feedback"
  ON feedback
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can update feedback
CREATE POLICY "Admins can update feedback"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Admins can delete feedback
CREATE POLICY "Admins can delete feedback"
  ON feedback
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- MIGRATION 007b: Email Domain Validation
-- ============================================================================
-- Creates function and trigger to validate AAMU email domains
-- ============================================================================

-- Create function to validate AAMU email domains
CREATE OR REPLACE FUNCTION validate_aamu_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email ends with allowed domains
  IF NEW.email !~* '@(aamu\.edu|bulldogs\.aamu\.edu)$' THEN
    RAISE EXCEPTION 'Only @aamu.edu and @bulldogs.aamu.edu email addresses are allowed'
      USING ERRCODE = 'check_violation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users table
CREATE TRIGGER validate_email_domain_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION validate_aamu_email();

-- ============================================================================
-- MIGRATION 008: User Profile Fields
-- ============================================================================
-- Adds profile fields (avatar, birthday, location, gender) to users table
-- These fields are used in the settings and profile pages
-- ============================================================================

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

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All migrations have been applied successfully.
-- Your database is now ready for the GDG Opportunities Hub application.
-- ============================================================================


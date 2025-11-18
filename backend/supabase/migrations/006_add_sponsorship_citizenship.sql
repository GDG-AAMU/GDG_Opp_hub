-- Migration: Add sponsorship and citizenship fields to opportunities table
-- Created: 2025-11-18
-- Description: Adds fields to track visa sponsorship availability and US citizenship requirements

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

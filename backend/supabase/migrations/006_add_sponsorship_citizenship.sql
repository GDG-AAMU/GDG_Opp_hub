-- Migration: Add sponsorship and citizenship fields to opportunities table
-- Created: 2025-11-18
-- Description: Adds fields to track visa sponsorship availability and US citizenship requirements

-- Add new columns to opportunities table
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS offers_sponsorship BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS requires_us_citizenship BOOLEAN DEFAULT NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN opportunities.offers_sponsorship IS 'Indicates whether the opportunity offers visa sponsorship. NULL = unknown, TRUE = offers sponsorship, FALSE = does not offer sponsorship';
COMMENT ON COLUMN opportunities.requires_us_citizenship IS 'Indicates whether US citizenship is required. NULL = unknown, TRUE = requires citizenship, FALSE = does not require citizenship';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_opportunities_offers_sponsorship ON opportunities(offers_sponsorship);
CREATE INDEX IF NOT EXISTS idx_opportunities_requires_us_citizenship ON opportunities(requires_us_citizenship);

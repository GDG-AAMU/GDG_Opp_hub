-- User Opportunities Migration
-- Allows users to save and track applied opportunities

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


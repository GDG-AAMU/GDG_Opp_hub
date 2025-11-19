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

-- Email Notifications Migration
-- Adds notification preferences to users table and creates email queue system

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


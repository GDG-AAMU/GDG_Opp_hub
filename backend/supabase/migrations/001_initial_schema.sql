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
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function when new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


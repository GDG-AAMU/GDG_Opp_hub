# Database Migration Guide

## Quick Setup for New Supabase Project

If you're setting up a fresh Supabase project, you can use the combined migration file to set up the entire database at once.

### Option 1: Use Combined Migration (Recommended for New Projects)

1. Create a new Supabase project at https://app.supabase.com
2. Go to **SQL Editor** in your Supabase dashboard
3. Open the file: `backend/supabase/migrations/000_complete_schema.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for all migrations to complete (should take 10-30 seconds)

**That's it!** Your database is now fully set up.

### Option 2: Run Individual Migrations (For Existing Projects)

If you already have a database with some migrations applied, run the remaining ones individually:

1. Go to **SQL Editor** in your Supabase dashboard
2. Run migrations in this order:
   - `001_initial_schema.sql`
   - `003_email_notifications.sql` (skip 002 - it's test data)
   - `004_user_opportunities.sql`
   - `005_logo_verification_system.sql`
   - `006_add_sponsorship_citizenship.sql`
   - `007_feedback_system.sql`
   - `007_validate_email_domain.sql`
   - `008_add_user_profile_fields.sql`

## What Gets Created

### Tables
- `users` - User profiles and authentication
- `opportunities` - Job/internship/research opportunities
- `user_opportunities` - User saved/applied opportunities tracking
- `email_queue` - Email notification queue
- `email_logs` - Email delivery logs
- `feedback` - User feedback submissions
- `domain_mappings` - Logo domain mapping overrides
- `logo_assets` - Manually uploaded logo metadata

### Enums
- `user_role` - 'student' | 'admin'
- `opportunity_type` - 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
- `opportunity_status` - 'active' | 'expired'
- `feedback_status` - 'new' | 'in_progress' | 'resolved'
- `feedback_type` - 'bug' | 'feature_request' | 'general' | 'other'

### Functions
- `update_updated_at_column()` - Auto-updates `updated_at` timestamps
- `handle_new_user()` - Creates user record when auth user signs up
- `validate_aamu_email()` - Validates email domain on signup
- `update_logo_timestamp()` - Updates logo timestamp
- `increment_mapping_verified_count()` - Tracks logo verification

### Security
- Row Level Security (RLS) enabled on all tables
- Policies configured for proper access control
- Admin-only access for sensitive operations

## Post-Migration Setup

After running migrations, you need to:

1. **Configure Authentication**
   - Go to Authentication > Providers
   - Enable Email provider
   - Enable Google OAuth (add credentials)
   - Go to Authentication > URL Configuration
   - Add redirect URLs:
     - `http://localhost:3000/api/auth/callback` (development)
     - `https://your-domain.com/api/auth/callback` (production)

2. **Update Environment Variables**
   - Copy your new project credentials from Project Settings > API
   - Update `.env.local`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

3. **Create Admin User** (Optional)
   - Sign up normally through the app
   - Go to Supabase SQL Editor
   - Run:
     ```sql
     UPDATE users 
     SET role = 'admin' 
     WHERE email = 'your-admin-email@aamu.edu';
     ```

## Troubleshooting

### Error: "relation already exists"
- Some tables already exist - this is fine if you're running on an existing database
- The migrations use `IF NOT EXISTS` clauses to handle this

### Error: "type already exists"
- Enums already exist - this is fine
- The migrations will skip creating existing types

### Error: "policy already exists"
- RLS policies already exist - this is fine
- Some migrations use `DROP POLICY IF EXISTS` to handle this

### Migration fails partway through
- Check the error message
- The combined migration is idempotent - you can run it again
- Or run individual migrations starting from where it failed

## Notes

- **Migration 002 (seed data)** is NOT included in the combined file - it's optional test data
- If you need test data, run `002_seed_test_data.sql` separately after the main migrations
- The combined file is safe to run multiple times (idempotent)
- All migrations use `IF NOT EXISTS` clauses to prevent errors on re-runs


# Email Notifications System - Setup Guide

This guide will help you set up the complete email notification system for the GDG Opportunities Hub.

## Overview

The email notification system includes:
- **Daily Digest**: Sends users a daily summary of new opportunities matching their major
- **Deadline Reminders**: Notifies users when opportunities are approaching their deadline (3-7 days)
- **Email Queue**: Processes emails asynchronously with retry logic
- **User Preferences**: Allows users to control their notification settings

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Resend API Key**: Get your API key from [Resend Dashboard](https://resend.com/api-keys)
3. **Domain Verification**: Verify your domain in Resend (for production)

## Setup Steps

### 1. Database Migration

Run the migration to create the necessary tables:

```bash
# Connect to your Supabase project
# Run the migration file:
# backend/supabase/migrations/003_email_notifications.sql
```

This creates:
- Notification preference columns in `users` table
- `email_queue` table for queuing emails
- `email_logs` table for tracking sent emails

### 2. Install Dependencies

```bash
cd frontend
npm install resend
```

### 3. Environment Variables

Add these to your `.env.local` file:

```env
# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=GDG Opportunities Hub

# Cron Job Security (optional but recommended)
CRON_SECRET=your_random_secret_string_here

# App URL (should already exist)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Important Notes:**
- `RESEND_FROM_EMAIL` must be a verified domain in Resend
- For development, you can use Resend's test domain: `onboarding@resend.dev`
- Generate a secure random string for `CRON_SECRET`

### 4. Regenerate TypeScript Types

After running the migration, regenerate your Supabase types:

```bash
# If using Supabase CLI
npx supabase gen types typescript --project-id your-project-id > frontend/lib/supabase/types.ts
```

Or manually update the `users` table type to include:
- `email_notifications_enabled: boolean | null`
- `daily_digest_enabled: boolean | null`
- `deadline_reminders_enabled: boolean | null`
- `daily_digest_time: string | null`
- `last_digest_sent_at: string | null`

### 5. Vercel Cron Configuration

The `vercel.json` file is already configured with three cron jobs:

1. **Daily Digest** (`/api/cron/daily-digest`): Runs at 6 PM UTC daily
2. **Deadline Reminders** (`/api/cron/deadline-reminders`): Runs at 9 AM UTC daily
3. **Queue Processor** (`/api/cron/process-queue`): Runs every 5 minutes

**To activate cron jobs on Vercel:**
1. Deploy your application to Vercel
2. Cron jobs are automatically configured from `vercel.json`
3. Verify in Vercel Dashboard > Settings > Cron Jobs

**For local development:**
- Use a service like [cron-job.org](https://cron-job.org) to ping your endpoints
- Or manually call the endpoints for testing

### 6. Testing

#### Test Email Sending

```bash
# Test the email service directly
curl -X POST http://localhost:3000/api/test-email
```

#### Test Daily Digest Cron

```bash
# Call the cron endpoint (add Authorization header if CRON_SECRET is set)
curl -X GET http://localhost:3000/api/cron/daily-digest \
  -H "Authorization: Bearer your_cron_secret"
```

#### Test Queue Processing

```bash
# Process pending emails
curl -X GET http://localhost:3000/api/cron/process-queue \
  -H "Authorization: Bearer your_cron_secret"
```

## Email Templates

The system uses HTML email templates with:
- **Brand colors**: Purple-blue gradient matching your app
- **Responsive design**: Works on mobile and desktop
- **Opportunity cards**: Beautiful cards for each opportunity
- **Action buttons**: Direct links to view opportunities

Templates are located in:
- `frontend/lib/email/templates/daily-digest.html`
- `frontend/lib/email/templates/deadline-reminder.html`
- `frontend/lib/email/templates/opportunity-card.html`

## User Preferences

Users can manage their notification preferences in:
- **Settings Page** → **Notifications** tab

Options include:
- Enable/disable email notifications
- Enable/disable daily digest
- Set daily digest time (default: 6 PM)
- Enable/disable deadline reminders

## Queue System

The email queue system provides:
- **Asynchronous processing**: Emails are queued and processed separately
- **Retry logic**: Failed emails are retried with exponential backoff
- **Error tracking**: Failed emails are logged with error messages
- **Batch processing**: Processes multiple emails efficiently

## Monitoring

### Check Email Queue Status

Query the `email_queue` table:
```sql
SELECT status, COUNT(*) 
FROM email_queue 
GROUP BY status;
```

### Check Email Logs

View sent emails:
```sql
SELECT * 
FROM email_logs 
ORDER BY sent_at DESC 
LIMIT 100;
```

### Check User Preferences

```sql
SELECT 
  email,
  email_notifications_enabled,
  daily_digest_enabled,
  deadline_reminders_enabled,
  daily_digest_time
FROM users;
```

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**: Verify it's correct in environment variables
2. **Check Domain Verification**: Ensure your domain is verified in Resend
3. **Check Queue Status**: Look for failed emails in `email_queue` table
4. **Check Logs**: Review server logs for error messages

### Cron Jobs Not Running

1. **Verify Vercel Deployment**: Cron jobs only work on deployed Vercel projects
2. **Check vercel.json**: Ensure cron configuration is correct
3. **Check Authorization**: If `CRON_SECRET` is set, verify the header is correct

### Users Not Receiving Emails

1. **Check User Preferences**: Verify `email_notifications_enabled = true`
2. **Check Major Filtering**: Ensure user has a major set and opportunities match
3. **Check Queue**: Verify emails are being queued successfully
4. **Check Spam Folder**: Ask users to check their spam/junk folder

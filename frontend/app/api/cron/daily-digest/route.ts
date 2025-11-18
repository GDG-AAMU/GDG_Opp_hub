import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { queueDailyDigest, type Opportunity } from '@/lib/email/queue'
import { processEmailQueue } from '@/lib/email/queue'

// This route should be called by Vercel Cron or similar
// Configure in vercel.json: { "cron": "0 18 * * *" } for 6 PM daily

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Get all users with daily digest enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, major, email_notifications_enabled, daily_digest_enabled, daily_digest_time, last_digest_sent_at')
      .eq('email_notifications_enabled', true)
      .eq('daily_digest_enabled', true)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users to send digest to', processed: 0 })
    }

    let queued = 0
    let skipped = 0
    const now = new Date()

    // Process each user
    for (const user of users) {
      try {
        // Check if user's daily digest time matches current time (within 1 hour window)
        // This allows for timezone differences
        const userDigestTime = user.daily_digest_time || '18:00:00'
        const [hours, minutes] = userDigestTime.split(':').map(Number)
        const userHour = hours || 18

        // Get current hour in UTC (adjust for user timezone if needed)
        const currentHour = now.getUTCHours()

        // Skip if not the right time (allow 1 hour window)
        if (Math.abs(currentHour - userHour) > 1 && Math.abs(currentHour - userHour) < 23) {
          skipped++
          continue
        }

        // Check if digest was already sent today
        if (user.last_digest_sent_at) {
          const lastSent = new Date(user.last_digest_sent_at)
          const today = new Date()
          if (
            lastSent.getUTCFullYear() === today.getUTCFullYear() &&
            lastSent.getUTCMonth() === today.getUTCMonth() &&
            lastSent.getUTCDate() === today.getUTCDate()
          ) {
            skipped++
            continue
          }
        }

        // Get opportunities from last 24 hours matching user's major
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        let query = supabase
          .from('opportunities')
          .select('id, company_name, job_title, opportunity_type, deadline, location, description, url')
          .eq('status', 'active')
          .gte('created_at', yesterday.toISOString())
          .order('created_at', { ascending: false })
          .limit(50)

        // Filter by major if user has one
        if (user.major) {
          // Use JSONB contains operator
          const escapedMajor = (user.major as string).replace(/"/g, '\\"')
          query = query.or(`relevant_majors.cs.["${escapedMajor}"]`)
        }

        const { data: opportunities, error: oppError } = await query

        if (oppError) {
          console.error(`Error fetching opportunities for user ${user.id}:`, oppError)
          continue
        }

        if (!opportunities || opportunities.length === 0) {
          skipped++
          continue
        }

        // Queue the daily digest
        const result = await queueDailyDigest(
          user.id,
          opportunities as Opportunity[],
          appUrl,
          now
        )

        if (result.success) {
          // Update last_digest_sent_at
          await supabase
            .from('users')
            .update({ last_digest_sent_at: now.toISOString() })
            .eq('id', user.id)

          queued++
        } else {
          console.error(`Failed to queue digest for user ${user.id}:`, result.error)
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
      }
    }

    // Process the email queue
    const queueResult = await processEmailQueue(50)

    return NextResponse.json({
      message: 'Daily digest cron job completed',
      users_processed: users.length,
      emails_queued: queued,
      emails_skipped: skipped,
      queue_processed: queueResult.processed,
      queue_succeeded: queueResult.succeeded,
      queue_failed: queueResult.failed,
    })
  } catch (error) {
    console.error('Error in daily digest cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


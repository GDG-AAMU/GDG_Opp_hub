import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { queueDailyDigest, queueDeadlineReminder, type Opportunity } from '@/lib/email/queue'
import { processEmailQueue } from '@/lib/email/queue'

// Consolidated notifications cron job
// Runs at 6 PM daily to handle:
// - Daily digest emails
// - Deadline reminder emails (moved from 9 AM to 6 PM to consolidate)
// - Email queue processing
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
    const now = new Date()

    // Results tracking
    const results = {
      daily_digest: { queued: 0, skipped: 0, users_processed: 0 },
      deadline_reminders: { queued: 0, skipped: 0, users_processed: 0 },
      queue_processed: { processed: 0, succeeded: 0, failed: 0 }
    }

    // ===== DAILY DIGEST =====
    try {
      const { data: digestUsers, error: digestUsersError } = await supabase
        .from('users')
        .select('id, major, email_notifications_enabled, daily_digest_enabled, daily_digest_time, last_digest_sent_at')
        .eq('email_notifications_enabled', true)
        .eq('daily_digest_enabled', true)

      if (!digestUsersError && digestUsers && digestUsers.length > 0) {
        for (const user of digestUsers) {
          try {
            // Check if user's daily digest time matches current time (within 1 hour window)
            const userDigestTime = user.daily_digest_time || '18:00:00'
            const [hours] = userDigestTime.split(':').map(Number)
            const userHour = hours || 18
            const currentHour = now.getUTCHours()

            // Skip if not the right time (allow 1 hour window)
            if (Math.abs(currentHour - userHour) > 1 && Math.abs(currentHour - userHour) < 23) {
              results.daily_digest.skipped++
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
                results.daily_digest.skipped++
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

            if (user.major) {
              const escapedMajor = (user.major as string).replace(/"/g, '\\"')
              query = query.or(`relevant_majors.cs.["${escapedMajor}"]`)
            }

            const { data: opportunities, error: oppError } = await query

            if (oppError || !opportunities || opportunities.length === 0) {
              results.daily_digest.skipped++
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
              await supabase
                .from('users')
                .update({ last_digest_sent_at: now.toISOString() })
                .eq('id', user.id)
              results.daily_digest.queued++
            }
          } catch (error) {
            console.error(`Error processing daily digest for user ${user.id}:`, error)
          }
        }
        results.daily_digest.users_processed = digestUsers.length
      }
    } catch (error) {
      console.error('Error in daily digest:', error)
    }

    // ===== DEADLINE REMINDERS =====
    try {
      const { data: reminderUsers, error: reminderUsersError } = await supabase
        .from('users')
        .select('id, major, email_notifications_enabled, deadline_reminders_enabled')
        .eq('email_notifications_enabled', true)
        .eq('deadline_reminders_enabled', true)

      if (!reminderUsersError && reminderUsers && reminderUsers.length > 0) {
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

        for (const user of reminderUsers) {
          try {
            let query = supabase
              .from('opportunities')
              .select('id, company_name, job_title, opportunity_type, deadline, location, description, url')
              .eq('status', 'active')
              .not('deadline', 'is', null)
              .gte('deadline', threeDaysFromNow.toISOString().split('T')[0])
              .lte('deadline', sevenDaysFromNow.toISOString().split('T')[0])
              .order('deadline', { ascending: true })
              .limit(20)

            if (user.major) {
              const escapedMajor = (user.major as string).replace(/"/g, '\\"')
              query = query.or(`relevant_majors.cs.["${escapedMajor}"]`)
            }

            const { data: opportunities, error: oppError } = await query

            if (oppError || !opportunities || opportunities.length === 0) {
              results.deadline_reminders.skipped++
              continue
            }

            const result = await queueDeadlineReminder(
              user.id,
              opportunities as Opportunity[],
              appUrl,
              now
            )

            if (result.success) {
              results.deadline_reminders.queued++
            }
          } catch (error) {
            console.error(`Error processing deadline reminder for user ${user.id}:`, error)
          }
        }
        results.deadline_reminders.users_processed = reminderUsers.length
      }
    } catch (error) {
      console.error('Error in deadline reminders:', error)
    }

    // ===== PROCESS EMAIL QUEUE =====
    try {
      const queueResult = await processEmailQueue(50)
      results.queue_processed = queueResult
    } catch (error) {
      console.error('Error processing email queue:', error)
    }

    return NextResponse.json({
      message: 'Notifications cron job completed',
      daily_digest: results.daily_digest,
      deadline_reminders: results.deadline_reminders,
      email_queue: results.queue_processed,
    })
  } catch (error) {
    console.error('Error in notifications cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


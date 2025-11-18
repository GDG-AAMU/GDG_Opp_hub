import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { queueDeadlineReminder, type Opportunity } from '@/lib/email/queue'
import { processEmailQueue } from '@/lib/email/queue'

// This route should be called by Vercel Cron
// Configure in vercel.json: { "cron": "0 9 * * *" } for 9 AM daily

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

    // Get all users with deadline reminders enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, major, email_notifications_enabled, deadline_reminders_enabled')
      .eq('email_notifications_enabled', true)
      .eq('deadline_reminders_enabled', true)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users to send reminders to', processed: 0 })
    }

    let queued = 0
    let skipped = 0
    const now = new Date()

    // Calculate deadline range (3-7 days from now)
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // Process each user
    for (const user of users) {
      try {
        // Get opportunities with deadlines in 3-7 days matching user's major
        let query = supabase
          .from('opportunities')
          .select('id, company_name, job_title, opportunity_type, deadline, location, description, url')
          .eq('status', 'active')
          .not('deadline', 'is', null)
          .gte('deadline', threeDaysFromNow.toISOString().split('T')[0])
          .lte('deadline', sevenDaysFromNow.toISOString().split('T')[0])
          .order('deadline', { ascending: true })
          .limit(20)

        // Filter by major if user has one
        if (user.major) {
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

        // Queue the deadline reminder
        const result = await queueDeadlineReminder(
          user.id,
          opportunities as Opportunity[],
          appUrl,
          now
        )

        if (result.success) {
          queued++
        } else {
          console.error(`Failed to queue reminder for user ${user.id}:`, result.error)
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
      }
    }

    // Process the email queue
    const queueResult = await processEmailQueue(50)

    return NextResponse.json({
      message: 'Deadline reminders cron job completed',
      users_processed: users.length,
      emails_queued: queued,
      emails_skipped: skipped,
      queue_processed: queueResult.processed,
      queue_succeeded: queueResult.succeeded,
      queue_failed: queueResult.failed,
    })
  } catch (error) {
    console.error('Error in deadline reminders cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


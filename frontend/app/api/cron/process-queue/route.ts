import { NextRequest, NextResponse } from 'next/server'
import { processEmailQueue } from '@/lib/email/queue'

// This route processes the email queue
// Runs once per day at 7 PM as a backup to catch any failed or missed emails
// Configure in vercel.json: { "cron": "0 19 * * *" } for 7 PM daily
// Note: Daily digest and deadline reminders process emails immediately after queuing,
// so this is primarily a backup/cleanup job for any missed emails

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const batchSize = parseInt(request.nextUrl.searchParams.get('batch_size') || '50', 10)

    const result = await processEmailQueue(batchSize)

    return NextResponse.json({
      message: 'Email queue processed',
      ...result,
    })
  } catch (error) {
    console.error('Error processing email queue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


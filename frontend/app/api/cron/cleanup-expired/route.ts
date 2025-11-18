import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This route should be called by Vercel Cron
// Configure in vercel.json: { "cron": "0 2 * * 0" } for 2 AM every Sunday
// Deletes expired opportunities older than 90 days to save database space

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    
    // Calculate cutoff date (90 days ago)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)
    const cutoffISO = cutoffDate.toISOString()

    // Find expired opportunities older than 90 days
    const { data: oldExpired, error: fetchError } = await supabase
      .from('opportunities')
      .select('id, company_name, job_title, expired_at')
      .eq('status', 'expired')
      .not('expired_at', 'is', null)
      .lt('expired_at', cutoffISO) // expired_at < 90 days ago

    if (fetchError) {
      console.error('Error fetching old expired opportunities:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 })
    }

    if (!oldExpired || oldExpired.length === 0) {
      return NextResponse.json({
        message: 'No old expired opportunities to clean up',
        deleted_count: 0,
      })
    }

    // Delete old expired opportunities
    const { error: deleteError } = await supabase
      .from('opportunities')
      .delete()
      .eq('status', 'expired')
      .not('expired_at', 'is', null)
      .lt('expired_at', cutoffISO)

    if (deleteError) {
      console.error('Error deleting old expired opportunities:', deleteError)
      return NextResponse.json({ error: 'Failed to delete opportunities' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Cleanup cron job completed',
      deleted_count: oldExpired.length,
      cutoff_date: cutoffISO,
      sample_deleted: oldExpired.slice(0, 5).map(opp => ({
        id: opp.id,
        company: opp.company_name,
        title: opp.job_title,
        expired_at: opp.expired_at,
      })),
    })
  } catch (error) {
    console.error('Error in cleanup cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Consolidated maintenance cron job
// Runs at midnight daily to handle:
// - Auto-expire opportunities (daily)
// - Cleanup expired opportunities older than 90 days (only on Sunday)
// Configure in vercel.json: { "cron": "0 0 * * *" } for midnight daily

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const now = new Date()
    const isSunday = now.getUTCDay() === 0 // 0 = Sunday

    const results = {
      auto_expire: { expired_count: 0, opportunities: [] as Array<{ id: string; company: string; title: string; deadline: string | null }> },
      cleanup: { deleted_count: 0, cutoff_date: '', sample_deleted: [] as Array<{ id: string; company: string; title: string; expired_at: string | null }> }
    }

    // ===== AUTO-EXPIRE OPPORTUNITIES =====
    try {
      const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format

      // Find all active opportunities where deadline has passed
      const { data: expiredOpportunities, error: fetchError } = await supabase
        .from('opportunities')
        .select('id, company_name, job_title, deadline')
        .eq('status', 'active')
        .not('deadline', 'is', null)
        .lt('deadline', today) // deadline < today

      if (!fetchError && expiredOpportunities && expiredOpportunities.length > 0) {
        // Mark all expired opportunities
        const { data: updatedData, error: updateError } = await supabase
          .from('opportunities')
          .update({
            status: 'expired',
            expired_at: new Date().toISOString(),
          })
          .eq('status', 'active')
          .not('deadline', 'is', null)
          .lt('deadline', today)
          .select('id')

        if (!updateError && updatedData) {
          results.auto_expire.expired_count = updatedData.length
          results.auto_expire.opportunities = expiredOpportunities.map(opp => ({
            id: opp.id,
            company: opp.company_name,
            title: opp.job_title,
            deadline: opp.deadline,
          }))
        }
      }
    } catch (error) {
      console.error('Error in auto-expire:', error)
    }

    // ===== CLEANUP EXPIRED OPPORTUNITIES (Only on Sunday) =====
    if (isSunday) {
      try {
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

        if (!fetchError && oldExpired && oldExpired.length > 0) {
          // Delete old expired opportunities
          const { error: deleteError } = await supabase
            .from('opportunities')
            .delete()
            .eq('status', 'expired')
            .not('expired_at', 'is', null)
            .lt('expired_at', cutoffISO)

          if (!deleteError) {
            results.cleanup.deleted_count = oldExpired.length
            results.cleanup.cutoff_date = cutoffISO
            results.cleanup.sample_deleted = oldExpired.slice(0, 5).map(opp => ({
              id: opp.id,
              company: opp.company_name,
              title: opp.job_title,
              expired_at: opp.expired_at,
            }))
          }
        }
      } catch (error) {
        console.error('Error in cleanup:', error)
      }
    }

    return NextResponse.json({
      message: 'Maintenance cron job completed',
      auto_expire: results.auto_expire,
      cleanup: isSunday ? results.cleanup : { message: 'Skipped (only runs on Sunday)' },
    })
  } catch (error) {
    console.error('Error in maintenance cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


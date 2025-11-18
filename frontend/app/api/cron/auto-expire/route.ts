import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This route should be called by Vercel Cron
// Configure in vercel.json: { "cron": "0 0 * * *" } for midnight daily
// Automatically marks opportunities as expired when deadline has passed

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format

    // Find all active opportunities where deadline has passed
    const { data: expiredOpportunities, error: fetchError } = await supabase
      .from('opportunities')
      .select('id, company_name, job_title, deadline')
      .eq('status', 'active')
      .not('deadline', 'is', null)
      .lt('deadline', today) // deadline < today

    if (fetchError) {
      console.error('Error fetching expired opportunities:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 })
    }

    if (!expiredOpportunities || expiredOpportunities.length === 0) {
      return NextResponse.json({
        message: 'No opportunities to expire',
        expired_count: 0,
      })
    }

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

    if (updateError) {
      console.error('Error updating expired opportunities:', updateError)
      return NextResponse.json({ error: 'Failed to update opportunities' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Auto-expire cron job completed',
      expired_count: updatedData?.length || 0,
      opportunities: expiredOpportunities.map(opp => ({
        id: opp.id,
        company: opp.company_name,
        title: opp.job_title,
        deadline: opp.deadline,
      })),
    })
  } catch (error) {
    console.error('Error in auto-expire cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


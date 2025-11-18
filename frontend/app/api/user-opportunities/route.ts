import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { opportunityId, status } = body

    if (!opportunityId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: opportunityId and status' },
        { status: 400 }
      )
    }

    if (status !== 'saved' && status !== 'applied') {
      return NextResponse.json(
        { error: 'Status must be either "saved" or "applied"' },
        { status: 400 }
      )
    }

    // Check if opportunity exists
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('id')
      .eq('id', opportunityId)
      .single()

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    // Check if record already exists
    const { data: existing } = await supabase
      .from('user_opportunities')
      .select('id, status, applied_at')
      .eq('user_id', user.id)
      .eq('opportunity_id', opportunityId)
      .maybeSingle()

    // Prepare applied_at value
    let appliedAt: string | null = null
    if (status === 'applied') {
      // If changing to applied, set applied_at to now (or keep existing if already applied)
      appliedAt = existing?.status === 'applied' && existing?.applied_at 
        ? existing.applied_at 
        : new Date().toISOString()
    } else {
      // For 'saved', set applied_at to null
      appliedAt = null
    }

    let data, error
    if (existing) {
      // Update existing record
      const result = await supabase
        .from('user_opportunities')
        .update({
          status,
          applied_at: appliedAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Insert new record
      const result = await supabase
        .from('user_opportunities')
        .insert({
          user_id: user.id,
          opportunity_id: opportunityId,
          status,
          applied_at: appliedAt,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error saving user opportunity:', error)
      return NextResponse.json(
        { error: 'Failed to save opportunity status', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error in POST /api/user-opportunities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'saved' or 'applied' or null for all

    // Build query
    let query = supabase
      .from('user_opportunities')
      .select(`
        *,
        opportunities (
          id,
          company_name,
          job_title,
          opportunity_type,
          role_type,
          location,
          deadline,
          url,
          status,
          created_at,
          offers_sponsorship,
          requires_us_citizenship
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status === 'saved' || status === 'applied') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching user opportunities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch opportunities' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || []
    })
  } catch (error) {
    console.error('Error in GET /api/user-opportunities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const opportunityId = searchParams.get('opportunityId')

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'Missing opportunityId parameter' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_opportunities')
      .delete()
      .eq('user_id', user.id)
      .eq('opportunity_id', opportunityId)

    if (error) {
      console.error('Error deleting user opportunity:', error)
      return NextResponse.json(
        { error: 'Failed to remove opportunity status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error in DELETE /api/user-opportunities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


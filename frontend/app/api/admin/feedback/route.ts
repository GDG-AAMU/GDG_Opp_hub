import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'new' | 'in_progress' | 'resolved' | 'all'
    const type = searchParams.get('type') // 'bug' | 'feature_request' | 'general' | 'other' | 'all'
    const search = searchParams.get('search') // search term
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('feedback')
      .select(`
        *,
        users!feedback_user_id_fkey (
          id,
          name,
          email
        ),
        resolved_user:users!feedback_resolved_by_fkey (
          id,
          name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status as any)
    }

    if (type && type !== 'all') {
      query = query.eq('feedback_type', type as any)
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching feedback:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      )
    }

    // Format response
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      user_name: item.users?.name || 'Anonymous',
      user_email: item.users?.email || null,
      feedback_type: item.feedback_type,
      subject: item.subject,
      description: item.description,
      page_url: item.page_url,
      status: item.status,
      admin_notes: item.admin_notes,
      resolved_by: item.resolved_by,
      resolved_by_name: item.resolved_user?.name || null,
      resolved_at: item.resolved_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
    })) || []

    return NextResponse.json({
      data: formattedData,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

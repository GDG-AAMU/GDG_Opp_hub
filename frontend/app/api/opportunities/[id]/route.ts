import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/supabase/types"

type UserRole = Database["public"]["Tables"]["users"]["Row"]["role"]
type OpportunityUpdate = Database["public"]["Tables"]["opportunities"]["Update"]

interface RouteParams {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Validate UUID format first (before auth check for better error messages)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: "Invalid opportunity ID format" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch opportunity with user name join
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        users!submitted_by (
          name
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Opportunity not found" },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: "Failed to fetch opportunity" },
        { status: 500 }
      )
    }

    // Get user's status for this opportunity
    const { data: userOpportunity } = await supabase
      .from('user_opportunities')
      .select('status')
      .eq('user_id', user.id)
      .eq('opportunity_id', params.id)
      .single()

    // Add userStatus to the response
    const opportunityWithStatus = {
      ...data,
      userStatus: userOpportunity?.status || null
    }

    return NextResponse.json(opportunityWithStatus)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Validate UUID format first
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: "Invalid opportunity ID format" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: UserRole }>()

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields if provided
    const allowedFields = [
      'company_name',
      'job_title',
      'opportunity_type',
      'role_type',
      'relevant_majors',
      'deadline',
      'requirements',
      'location',
      'description',
      'status'
    ]

    const updateData: Partial<OpportunityUpdate> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field as keyof OpportunityUpdate] = body[field]
      }
    }

    // Update the opportunity in the database
    const { data, error } = await supabase
      .from('opportunities')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Opportunity not found" },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: "Failed to update opportunity" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Validate UUID format first
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: "Invalid opportunity ID format" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: UserRole }>()

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    // Soft delete: Update status to expired
    const deleteUpdate = {
      status: 'expired' as const,
      expired_at: new Date().toISOString()
    }
    const { data, error } = await supabase
      .from('opportunities')
      .update(deleteUpdate)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Opportunity not found" },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: "Failed to delete opportunity" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Opportunity deleted successfully",
      data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

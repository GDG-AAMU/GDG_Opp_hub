import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type OpportunityType = 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
type OpportunityStatus = 'active' | 'expired'
type SortOption = 'deadline-asc' | 'deadline-desc' | 'recent' | 'company-asc'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message || "No user found" },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as OpportunityType | null
    const majors = searchParams.get('majors')
    const roles = searchParams.get('roles')
    const status = (searchParams.get('status') as OpportunityStatus) || 'active'
    const sort = (searchParams.get('sort') as SortOption) || 'deadline-asc'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with user name join
    let query = supabase
      .from('opportunities')
      .select(`
        *,
        users!submitted_by (
          name
        )
      `, { count: 'exact' })

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply type filter (can be multiple types separated by comma)
    if (type) {
      const types = type.split(',').map(t => t.trim())
      if (types.length === 1) {
        query = query.eq('opportunity_type', types[0])
      } else {
        query = query.in('opportunity_type', types)
      }
    }

    if (roles) {
      const roleList = roles.split(',').map(r => r.trim()).filter(Boolean)
      if (roleList.length === 1) {
        query = query.eq('role_type', roleList[0])
      } else if (roleList.length > 1) {
        query = query.in('role_type', roleList)
      }
    }

    // Apply major filter (comma separated values)
    if (majors) {
      const majorList = majors.split(',').map(m => m.trim()).filter(Boolean)

      // Use PostgREST 'cs' (contains) operator for JSONB arrays
      // Format: relevant_majors.cs.["MajorName"] checks if the JSONB array contains the value
      const orFilters = majorList
        .map((major) => {
          // Escape quotes in major name for JSON
          const escapedMajor = major.replace(/"/g, '\\"')
          // Format: relevant_majors.cs.["MajorName"]
          return `relevant_majors.cs.["${escapedMajor}"]`
        })
        .join(',')
      query = query.or(orFilters)
    }

    // Apply sorting
    switch (sort) {
      case 'deadline-asc':
        query = query.order('deadline', { ascending: true, nullsFirst: false })
        break
      case 'deadline-desc':
        query = query.order('deadline', { ascending: false, nullsFirst: false })
        break
      case 'recent':
        query = query.order('created_at', { ascending: false })
        break
      case 'company-asc':
        query = query.order('company_name', { ascending: true })
        break
      default:
        query = query.order('deadline', { ascending: true, nullsFirst: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: "Failed to fetch opportunities" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST() {
  // POST is handled by /api/opportunities/submit route
  return NextResponse.json(
    { error: "Use /api/opportunities/submit to create opportunities" },
    { status: 400 }
  )
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Database } from "@/lib/supabase/types"

type OpportunityType = 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'
type OpportunityStatus = 'active' | 'expired'
type OpportunityStatusFilter = OpportunityStatus | 'all'
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
    const rolesParam = searchParams.get('roles')
    const sponsorshipParam = searchParams.get('sponsorship') // 'offers' | 'no-offers'
    const citizenshipParam = searchParams.get('citizenship') // 'required' | 'not-required'
    const status = (searchParams.get('status') as OpportunityStatusFilter) || 'active'
    const sort = (searchParams.get('sort') as SortOption) || 'deadline-asc'
    const searchQuery = searchParams.get('search')
      ? searchParams.get('search')!.trim()
      : ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const hideApplied = searchParams.get('hideApplied') !== 'false' // Default to true

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
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply type filter (can be multiple types separated by comma)
    if (type) {
      const types = type.split(',').map(t => t.trim())
      if (types.length === 1) {
        query = query.eq('opportunity_type', types[0] as Database['public']['Tables']['opportunities']['Row']['opportunity_type'])
      } else {
        query = query.in('opportunity_type', types as Database['public']['Tables']['opportunities']['Row']['opportunity_type'][])
      }
    }

    if (searchQuery) {
      const sanitizedQuery = searchQuery.trim()

      if (sanitizedQuery) {
        const encodedSearch = encodeURIComponent(sanitizedQuery)
        const ilikeQuery = sanitizedQuery
          .replace(/%/g, '')
          .replace(/,/g, '')
          .replace(/'/g, "''")

        const orFilters = [`search_vector.wfts.english.${encodedSearch}`]

        if (ilikeQuery) {
          orFilters.push(
            `company_name.ilike.%${ilikeQuery}%`,
            `job_title.ilike.%${ilikeQuery}%`,
            `description.ilike.%${ilikeQuery}%`,
            `requirements.ilike.%${ilikeQuery}%`,
            `role_type.ilike.%${ilikeQuery}%`,
            `location.ilike.%${ilikeQuery}%`
          )
        }

        query = query.or(orFilters.join(','))
      }
    }

    if (rolesParam) {
      const roles = rolesParam
        .split(',')
        .map(role => role.trim())
        .filter(Boolean)

      if (roles.length === 1) {
        query = query.eq('role_type', roles[0])
      } else if (roles.length > 1) {
        query = query.in('role_type', roles)
      }
    }

    // Apply sponsorship filter
    if (sponsorshipParam) {
      if (sponsorshipParam === 'offers') {
        query = query.eq('offers_sponsorship', true)
      } else if (sponsorshipParam === 'no-offers') {
        query = query.eq('offers_sponsorship', false)
      }
    }

    // Apply citizenship filter
    if (citizenshipParam) {
      if (citizenshipParam === 'required') {
        query = query.eq('requires_us_citizenship', true)
      } else if (citizenshipParam === 'not-required') {
        query = query.eq('requires_us_citizenship', false)
      }
    }

    // Apply major filter (comma separated values)
    if (majors) {
      const majorList = majors.split(',').map(m => m.trim()).filter(Boolean)

      // Use PostgREST 'cs' (contains) operator for JSONB arrays
      // Format: relevant_majors.cs.["MajorName"] checks if the JSONB array contains the value
      const orFilters = majorList
        .map((majors) => {
          // Escape quotes in major name for JSON
          const escapedMajor = majors.replace(/"/g, '\\"')
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

    // Get user's opportunity statuses
    const { data: userOpportunities } = await supabase
      .from('user_opportunities')
      .select('opportunity_id, status')
      .eq('user_id', user.id)

    // Create a map of opportunity_id -> status
    const userStatusMap = new Map<string, 'saved' | 'applied'>()
    userOpportunities?.forEach((uo) => {
      userStatusMap.set(uo.opportunity_id, uo.status as 'saved' | 'applied')
    })

    // Filter out applied opportunities if hideApplied is true
    let filteredData = (data || []).map((opp: any) => ({
      ...opp,
      userStatus: userStatusMap.get(opp.id) || null
    }))

    if (hideApplied) {
      filteredData = filteredData.filter((opp: any) => opp.userStatus !== 'applied')
    }

    // Recalculate count after filtering
    const filteredCount = hideApplied 
      ? (count || 0) - (userOpportunities?.filter(uo => uo.status === 'applied').length || 0)
      : (count || 0)

    return NextResponse.json({
      data: filteredData,
      pagination: {
        total: filteredCount,
        limit,
        offset,
        hasMore: filteredCount > offset + limit
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

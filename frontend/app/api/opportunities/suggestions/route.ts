import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 10

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { suggestions: [], error: "Unauthorized" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')?.trim()

    if (!query || query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ suggestions: [] })
    }

    const sanitizedQuery = query
      .replace(/%/g, '')
      .replace(/_/g, '')
      .replace(/'/g, "''")
      .trim()

    if (!sanitizedQuery) {
      return NextResponse.json({ suggestions: [] })
    }

    const { data, error } = await supabase
      .from('opportunities')
      .select('company_name, job_title')
      .or(`company_name.ilike.%${sanitizedQuery}%,job_title.ilike.%${sanitizedQuery}%`)
      .limit(MAX_RESULTS)

    if (error) {
      console.error('Suggestion query error:', error)
      return NextResponse.json(
        { suggestions: [], error: "Failed to fetch suggestions" },
        { status: 500 }
      )
    }

    const uniqueSuggestions = new Set<string>()

    data?.forEach(item => {
      if (item.company_name && item.company_name.toLowerCase().includes(query.toLowerCase())) {
        uniqueSuggestions.add(item.company_name)
      }
      if (item.job_title && item.job_title.toLowerCase().includes(query.toLowerCase())) {
        uniqueSuggestions.add(item.job_title)
      }
    })

    return NextResponse.json({
      suggestions: Array.from(uniqueSuggestions).slice(0, MAX_RESULTS)
    })
  } catch (error) {
    console.error('Suggestion API error:', error)
    return NextResponse.json(
      { suggestions: [], error: "Internal server error" },
      { status: 500 }
    )
  }
}

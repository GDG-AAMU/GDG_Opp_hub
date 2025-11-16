import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { submitOpportunitySchema } from "@/lib/validations/opportunity"

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    // Validate request body with Zod schema
    const validationResult = submitOpportunitySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    const { url, company_name, opportunity_type } = validationResult.data

    // Placeholder response until Gemini integration is complete
    // When integrated: scrape URL, parse with Gemini, save to database, return opportunity
    return NextResponse.json({
      success: true,
      message: "Opportunity submitted successfully. AI parsing is pending integration.",
      data: {
        id: `placeholder-${Date.now()}`,
        url,
        company_name: company_name || null,
        opportunity_type,
        status: "pending",
        submitted_by: user.id,
        created_at: new Date().toISOString(),
      }
    }, { status: 200 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


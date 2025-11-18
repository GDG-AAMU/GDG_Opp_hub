import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { submitOpportunitySchema } from "@/lib/validations/opportunity"
import { smartScrape } from "@/backend/services/smart-scraper"
import { parseJobPostingFromText, GeminiAPIError, RateLimitError } from "@/lib/ai/gemini"

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

    const { url, company_name: userProvidedCompany, opportunity_type: userProvidedType } = validationResult.data
    const manualContent = (body as any).manualContent // Get manual content if provided

    console.log(`[Submit] Starting submission for URL: ${url}`)
    if (manualContent) {
      console.log(`[Submit] Manual content provided (${manualContent.length} chars)`)
    }

    // Step 1: Check if URL already exists
    const { data: existingOpportunity } = await (supabase
      .from('opportunities') as any)
      .select('id, job_title, company_name, status, expired_at')
      .eq('url', url)
      .maybeSingle()

    // If URL exists and is active, reject as duplicate
    if (existingOpportunity && existingOpportunity.status === 'active') {
      return NextResponse.json(
        {
          error: "Duplicate opportunity",
          message: "This opportunity already exists"
        },
        { status: 409 }
      )
    }

    // If URL exists but is expired, delete it to allow resubmission
    if (existingOpportunity && existingOpportunity.status === 'expired') {
      console.log(`[Submit] Found expired opportunity with same URL, deleting to allow resubmission`)
      const { error: deleteError } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', existingOpportunity.id)

      if (deleteError) {
        console.error(`[Submit] Failed to delete expired opportunity:`, deleteError)
      } else {
        console.log(`[Submit] Deleted expired opportunity (ID: ${existingOpportunity.id})`)
      }
    }

    // INSTANT SAVE: Save immediately with basic info so user can continue
    const quickSave = {
      url,
      company_name: userProvidedCompany || 'Loading...',
      job_title: 'Loading...',
      opportunity_type: userProvidedType || 'internship',
      submitted_by: user.id,
      status: 'active',
    }

    const { data: savedOpportunity, error: quickSaveError } = await (supabase
      .from('opportunities') as any)
      .insert([quickSave])
      .select(`
        *,
        users!submitted_by (
          name
        )
      `)
      .single()

    if (quickSaveError) {
      console.error(`[Submit] Quick save failed:`, quickSaveError)

      if (quickSaveError.code === '23505') {
        return NextResponse.json(
          {
            error: "Duplicate opportunity",
            message: "This opportunity already exists"
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          error: "Database error",
          message: "Failed to save opportunity"
        },
        { status: 500 }
      )
    }

    console.log(`[Submit] Quick save successful: ${savedOpportunity.id}`)

    // Background processing: Update with full details (fire and forget)
    (async () => {
      try {
        console.log(`[Background] Starting processing for ${savedOpportunity.id}`)

        const scrapeResult = await smartScrape({
          url,
          manualContent,
          timeout: 30000
        })

        if (!scrapeResult.success || !scrapeResult.content) {
          console.error(`[Background] Scraping failed:`, scrapeResult.error)
          return
        }

        console.log(`[Background] Scraping successful (${scrapeResult.content.length} chars)`)

        const parsedData = await parseJobPostingFromText(scrapeResult.content, {
          timeout: 30000,
          maxRetries: 3
        })

        console.log(`[Background] AI parsing successful`)

        // Update the opportunity with full details
        const updateData = {
          company_name: userProvidedCompany || parsedData.company_name || savedOpportunity.company_name,
          job_title: parsedData.job_title || 'Position Not Specified',
          role_type: parsedData.role_type,
          relevant_majors: parsedData.relevant_majors || [],
          deadline: parsedData.deadline,
          requirements: parsedData.requirements,
          location: parsedData.location,
          description: parsedData.description,
          ai_parsed_data: parsedData,
        }

        await supabase
          .from('opportunities')
          .update(updateData)
          .eq('id', savedOpportunity.id)

        console.log(`[Background] Updated opportunity ${savedOpportunity.id} with full details`)
      } catch (error) {
        console.error(`[Background] Processing failed for ${savedOpportunity.id}:`, error)
      }
    })()

    // Return immediately - user can continue browsing
    return NextResponse.json({
      success: true,
      message: "Opportunity submitted successfully!",
      data: savedOpportunity,
    }, { status: 201 })

  } catch (error) {
    console.error('[Submit] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { submitOpportunitySchema } from "@/lib/validations/opportunity"
import { smartScrape } from "@/lib/services/smart-scraper"
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
    // This allows the same role to be resubmitted if it opens again
    if (existingOpportunity && existingOpportunity.status === 'expired') {
      console.log(`[Submit] Found expired opportunity with same URL, deleting to allow resubmission`)
      const { error: deleteError } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', existingOpportunity.id)
      
      if (deleteError) {
        console.error(`[Submit] Failed to delete expired opportunity:`, deleteError)
        // Continue anyway - the insert might still work if there's a race condition
      } else {
        console.log(`[Submit] Deleted expired opportunity (ID: ${existingOpportunity.id})`)
      }
    }

    // Step 2: Scrape the URL (or use manual content)
    console.log(`[Submit] Scraping URL...`)
    const scrapeResult = await smartScrape({ 
      url,
      manualContent,
      timeout: 30000 
    })

    if (!scrapeResult.success || !scrapeResult.content) {
      console.error(`[Submit] Scraping failed:`, scrapeResult.error)
      return NextResponse.json(
        { 
          error: "Failed to scrape URL",
          message: scrapeResult.error || "Could not extract content from the provided URL",
          requiresManual: scrapeResult.requiresManual,
          metadata: scrapeResult.metadata
        },
        { status: 400 }
      )
    }

    console.log(`[Submit] Scraping successful (${scrapeResult.content.length} chars, method: ${scrapeResult.method})`)

    // Step 3: Parse with Gemini AI
    console.log(`[Submit] Parsing with Gemini AI...`)
    console.log(`[Submit] Scraped content length: ${scrapeResult.content.length} chars`)
    let parsedData
    try {
      parsedData = await parseJobPostingFromText(scrapeResult.content, {
        timeout: 30000,
        maxRetries: 3
      })
      console.log(`[Submit] AI parsing successful`)
      console.log(`[Submit] Parsed data:`, JSON.stringify(parsedData, null, 2))
    } catch (error) {
      console.error(`[Submit] AI parsing failed:`, error)

      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { 
            error: "Rate limit exceeded",
            message: "Too many requests. Please try again in 60 seconds."
          },
          { status: 429 }
        )
      }

      if (error instanceof GeminiAPIError) {
        return NextResponse.json(
          { 
            error: "AI parsing failed",
            message: error.message
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { 
          error: "Parsing failed",
          message: "Failed to parse job posting with AI"
        },
        { status: 500 }
      )
    }

    // Step 4: Merge user-provided data with AI-parsed data (user data takes priority)
    const finalData = {
      url,
      company_name: userProvidedCompany || parsedData.company_name || 'Unknown Company',
      job_title: parsedData.job_title || 'Position Not Specified',
      opportunity_type: userProvidedType || parsedData.opportunity_type || 'internship',
      role_type: parsedData.role_type,
      relevant_majors: parsedData.relevant_majors || [],
      deadline: parsedData.deadline,
      requirements: parsedData.requirements,
      location: parsedData.location,
      description: parsedData.description,
      submitted_by: user.id,
      status: 'active',
      ai_parsed_data: parsedData, // Store original AI response
    }

    console.log(`[Submit] Final data before save:`, JSON.stringify({
      ...finalData,
      submitted_by: '[REDACTED]',
      ai_parsed_data: '[REDACTED]'
    }, null, 2))
    console.log(`[Submit] Saving to database...`)

    // Step 5: Insert into database
    const { data: opportunity, error: insertError } = await (supabase
      .from('opportunities') as any)
      .insert([finalData])
      .select(`
        *,
        users!submitted_by (
          name
        )
      `)
      .single()

    if (insertError) {
      console.error(`[Submit] Database insert failed:`, insertError)
      console.error(`[Submit] Failed data:`, JSON.stringify(finalData, null, 2))
      
      // Check for duplicate URL (in case of race condition)
      if (insertError.code === '23505') {
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
          message: "Failed to save opportunity to database"
        },
        { status: 500 }
      )
    }

    console.log(`[Submit] Success! Opportunity ID: ${opportunity?.id}`)
    console.log(`[Submit] Saved opportunity data:`, JSON.stringify({
      id: opportunity?.id,
      company_name: opportunity?.company_name,
      job_title: opportunity?.job_title,
      description: opportunity?.description ? `${opportunity.description.substring(0, 100)}...` : null,
      requirements: opportunity?.requirements ? `${opportunity.requirements.substring(0, 100)}...` : null,
      location: opportunity?.location,
      deadline: opportunity?.deadline,
    }, null, 2))

    // Step 6: Return success response
    return NextResponse.json({
      success: true,
      message: "Opportunity submitted successfully!",
      data: opportunity,
      metadata: {
        scrapeMethod: scrapeResult.method,
        aiParsed: true,
        scrapedContentLength: scrapeResult.content.length,
        parsedFields: {
          company_name: parsedData.company_name ? '✓' : '✗',
          job_title: parsedData.job_title ? '✓' : '✗',
          description: parsedData.description ? '✓' : '✗',
          requirements: parsedData.requirements ? '✓' : '✗',
          location: parsedData.location ? '✓' : '✗',
          deadline: parsedData.deadline ? '✓' : '✗',
        }
      }
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


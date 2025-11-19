import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { submitOpportunitySchema } from "@/lib/validations/opportunity"
import { smartScrape } from "@/lib/services/smart-scraper"
import { parseJobPostingFromUrl, parseJobPostingFromText, GeminiAPIError, RateLimitError } from "@/lib/ai/gemini"
import { filterContentForGemini } from "@/lib/services/content-filter"
import { Database } from "@/lib/supabase/types"

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

    // PRE-CHECK: If no manual content, quickly check if site is blocked before saving
    const hasManualContent = manualContent && manualContent.trim().length >= 50
    if (!hasManualContent) {
      // First, check URL domain for known restricted sites (fastest check)
      const urlLower = url.toLowerCase()
      const knownRestrictedDomains = [
        'linkedin.com',
        'facebook.com',
        'meta.com',
        'twitter.com',
        'x.com',
        'instagram.com',
      ]
      
      const isKnownRestricted = knownRestrictedDomains.some(domain => urlLower.includes(domain))
      
      if (isKnownRestricted) {
        return NextResponse.json(
          {
            error: "Manual content required",
            requiresManual: true,
            message: "This site requires authentication. Please paste the job description manually.",
          },
          { status: 400 }
        )
      }

      // Try Gemini URL parsing first (fastest way to detect blocked sites)
      try {
        await parseJobPostingFromUrl(url, {
          timeout: 10000, // 10 second timeout for pre-check
          maxRetries: 1, // Only 1 retry for speed
        })
      } catch (geminiError) {
        // Check if it's a blocked/authentication error
        const errorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError)
        const errorLower = errorMessage.toLowerCase()
        
        const isBlocked = (
          errorLower.includes('access denied') ||
          errorLower.includes('access_denied') ||
          errorLower.includes('401') ||
          errorLower.includes('403') ||
          errorLower.includes('forbidden') ||
          errorLower.includes('unauthorized') ||
          errorLower.includes('login required') ||
          errorLower.includes('sign in') ||
          errorLower.includes('authentication required') ||
          errorLower.includes('blocked') ||
          errorLower.includes('bot detection') ||
          errorLower.includes('captcha') ||
          errorLower.includes('rate limit') ||
          errorLower.includes('429')
        )

        if (isBlocked) {
          return NextResponse.json(
            {
              error: "Manual content required",
              requiresManual: true,
              message: "This site appears to be blocked or requires authentication. Please paste the job description manually.",
            },
            { status: 400 }
          )
        }

        // Gemini failed but not blocked - might be a parsing issue or slow site
        // Try a quick scrape check to see if we can at least get the page
        const { scrapeUrl } = await import('@/lib/services/web-scraper')
        const quickCheck = await scrapeUrl(url, {
          timeout: 8000, // 8 second timeout for quick check
          forceCheerio: true, // Only use Cheerio for speed
        })

        // Check scraped content for login page indicators
        if (quickCheck.success && quickCheck.content) {
          const contentLower = quickCheck.content.toLowerCase()
          const isLoginPage = (
            contentLower.includes('sign in') ||
            contentLower.includes('signin') ||
            contentLower.includes('log in') ||
            contentLower.includes('login') ||
            contentLower.includes('authentication required') ||
            contentLower.includes('please log in') ||
            contentLower.includes('access denied') ||
            (contentLower.includes('linkedin') && contentLower.includes('join'))
          )

          if (isLoginPage) {
            return NextResponse.json(
              {
                error: "Manual content required",
                requiresManual: true,
                message: "This site requires authentication. Please paste the job description manually.",
              },
              { status: 400 }
            )
          }
        }

        // Check if scrape error indicates blocking
        if (!quickCheck.success && quickCheck.error) {
          const errorLower = quickCheck.error.toLowerCase()
          const isBlockedError = (
            errorLower.includes('access denied') ||
            errorLower.includes('access_denied') ||
            errorLower.includes('401') ||
            errorLower.includes('403') ||
            errorLower.includes('forbidden') ||
            errorLower.includes('unauthorized') ||
            errorLower.includes('login required') ||
            errorLower.includes('sign in required') ||
            errorLower.includes('authentication required') ||
            errorLower.includes('blocked') ||
            errorLower.includes('bot detection') ||
            errorLower.includes('captcha')
          )

          if (isBlockedError) {
            return NextResponse.json(
              {
                error: "Manual content required",
                requiresManual: true,
                message: "This site appears to be blocked or requires authentication. Please paste the job description manually.",
              },
              { status: 400 }
            )
          }
        }

        // Pre-check failed but not clearly blocked - might be a slow site or other issue
        // We'll still save and let background processing handle it
      }
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
      const { error: deleteError } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', existingOpportunity.id)

      if (deleteError) {
        console.error(`[Submit] Failed to delete expired opportunity:`, deleteError)
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

    // Background processing: Update with full details (fire and forget)
    setImmediate(async () => {
      try {

        // Create service role client for background update (bypasses RLS)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        const serviceClient = createServiceClient<Database>(supabaseUrl, supabaseServiceKey)

        let parsedData: Awaited<ReturnType<typeof parseJobPostingFromText>> | null = null

        // Check if we have manual content
        const hasManualContent = manualContent && manualContent.trim().length >= 50

        // STEP 1: For manual content, skip Gemini URL and go straight to parsing
        // (We detect if site is blocked during scraping, not beforehand)
        if (hasManualContent) {
          // Manual content is already clean, use it directly (gentle filtering only)
          // Just trim and clean whitespace, don't aggressively filter
          const cleanedManualContent = manualContent.trim().replace(/\s+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n')
          
          try {
            parsedData = await parseJobPostingFromText(cleanedManualContent, {
              timeout: 30000,
              maxRetries: 3
            })
          } catch (manualParseError) {
            console.error(`[Background] Manual content parsing failed:`, manualParseError)
            // Update with user-provided fields as fallback instead of leaving "Loading..."
            await serviceClient
              .from('opportunities')
              .update({
                company_name: userProvidedCompany || 'Company Name Not Available',
                job_title: 'Job Title Not Available - Parsing Failed',
              })
              .eq('id', savedOpportunity.id)
            return
          }
        } else {
          // STEP 1: Try Gemini with URL first (original approach) - only for non-restricted sites
          try {
            parsedData = await parseJobPostingFromUrl(url, {
              timeout: 30000,
              maxRetries: 2 // Fewer retries for URL method
            })
          } catch (geminiUrlError) {

            // STEP 2: Fallback to scraper
            const scrapeResult = await smartScrape({
              url,
              manualContent,
              timeout: 30000
            })

            if (!scrapeResult.success || !scrapeResult.content) {
              console.error(`[Background] Scraping also failed:`, scrapeResult.error)
              // Update with user-provided fields as fallback instead of leaving "Loading..."
              await serviceClient
                .from('opportunities')
                .update({
                  company_name: userProvidedCompany || 'Company Name Not Available',
                  job_title: 'Job Title Not Available - Scraping Failed',
                })
                .eq('id', savedOpportunity.id)
              return
            }

            // STEP 3: Filter content before sending to Gemini
            // Use gentler filtering for manual content
            const contentToFilter = scrapeResult.content
            const filteredContent = hasManualContent 
              ? contentToFilter.trim().replace(/\s+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n') // Gentle cleaning for manual content
              : filterContentForGemini(contentToFilter) // Aggressive filtering for scraped content
            
            if (!filteredContent || filteredContent.trim().length < 50) {
              console.error(`[Background] Content filtering resulted in insufficient content`)
              // Update with user-provided fields as fallback instead of leaving "Loading..."
              await serviceClient
                .from('opportunities')
                .update({
                  company_name: userProvidedCompany || 'Company Name Not Available',
                  job_title: 'Job Title Not Available - Insufficient Content',
                })
                .eq('id', savedOpportunity.id)
              return
            }

            // STEP 4: Parse scraped content with Gemini
            try {
              parsedData = await parseJobPostingFromText(filteredContent, {
                timeout: 30000,
                maxRetries: 3
              })
            } catch (geminiTextError) {
              console.error(`[Background] Gemini text parsing failed:`, geminiTextError)
              // Update with user-provided fields as fallback instead of leaving "Loading..."
              await serviceClient
                .from('opportunities')
                .update({
                  company_name: userProvidedCompany || 'Company Name Not Available',
                  job_title: 'Job Title Not Available - Parsing Failed',
                })
                .eq('id', savedOpportunity.id)
              return
            }
          }
        }

        if (!parsedData) {
          console.error(`[Background] All parsing methods failed`)
          // Update with user-provided fields as fallback instead of leaving "Loading..."
          await serviceClient
            .from('opportunities')
            .update({
              company_name: userProvidedCompany || 'Company Name Not Available',
              job_title: 'Job Title Not Available - All Parsing Methods Failed',
            })
            .eq('id', savedOpportunity.id)
          return
        }

        // STEP 5: Update with smart field merging (preserve user input)
        const updateData = {
          // Always preserve user-provided type (highest priority)
          opportunity_type: userProvidedType || parsedData.opportunity_type || savedOpportunity.opportunity_type,
          
          // Use user-provided company name if available, otherwise use AI result
          company_name: userProvidedCompany || parsedData.company_name || savedOpportunity.company_name,
          
          // Only use AI job_title if it's valid (not "Position Not Specified")
          job_title: parsedData.job_title && parsedData.job_title !== 'Position Not Specified'
            ? parsedData.job_title
            : savedOpportunity.job_title,
          
          // Use AI results for other fields
          role_type: parsedData.role_type,
          relevant_majors: parsedData.relevant_majors || [],
          deadline: parsedData.deadline,
          requirements: parsedData.requirements,
          location: parsedData.location,
          description: parsedData.description,
          offers_sponsorship: parsedData.offers_sponsorship,
          requires_us_citizenship: parsedData.requires_us_citizenship,
          ai_parsed_data: parsedData as any, // Cast to Json type for Supabase
        }

        await serviceClient
          .from('opportunities')
          .update(updateData)
          .eq('id', savedOpportunity.id)
      } catch (error) {
        console.error(`[Background] Processing failed for ${savedOpportunity.id}:`, error)
        // Update with user-provided fields as fallback even on unexpected errors
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          const serviceClient = createServiceClient<Database>(supabaseUrl, supabaseServiceKey)
          
          await serviceClient
            .from('opportunities')
            .update({
              company_name: userProvidedCompany || 'Company Name Not Available',
              job_title: 'Job Title Not Available - Processing Error',
            })
            .eq('id', savedOpportunity.id)
        } catch (updateError) {
          console.error(`[Background] Failed to update fallback fields:`, updateError)
        }
      }
    })

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


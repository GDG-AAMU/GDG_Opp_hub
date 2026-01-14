import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY || ""

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

/**
 * Parsed job posting data structure
 */
export interface ParsedJobData {
  company_name: string | null
  job_title: string | null
  opportunity_type: 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship' | null
  role_type: string | null
  relevant_majors: string[] | null
  deadline: string | null // YYYY-MM-DD format
  requirements: string | null
  location: string | null
  description: string | null
  offers_sponsorship: boolean // TRUE if offers visa sponsorship (default), FALSE if explicitly states no sponsorship
  requires_us_citizenship: boolean // TRUE if requires US citizenship, FALSE if not required (default)
}

/**
 * Options for parsing job postings
 */
export interface ParseOptions {
  timeout?: number // Timeout in milliseconds (default: 30000)
  maxRetries?: number // Max retries on rate limit (default: 3)
  retryDelay?: number // Delay between retries in ms (default: 1000)
}

/**
 * Custom error types for better error handling
 */
export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'GeminiAPIError'
  }
}

export class RateLimitError extends GeminiAPIError {
  constructor(message: string = 'Rate limit exceeded. Please try again later.') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429)
    this.name = 'RateLimitError'
  }
}

/**
 * Parse job posting from URL (Primary Method)
 * 
 * Uses Gemini 2.0 Flash with URL input for direct parsing
 * 
 * @param url - Job posting URL
 * @param options - Parse options
 * @returns Parsed job data
 */
export async function parseJobPostingFromUrl(
  url: string,
  options: ParseOptions = {}
): Promise<ParsedJobData> {
  if (!genAI) {
    throw new GeminiAPIError("Gemini API key not configured", "API_KEY_MISSING")
  }

  const {
    timeout = 30000,
    maxRetries = 3,
    retryDelay = 1000
  } = options

  // Use Gemini 1.5 Flash (fast and reliable)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  })

  const prompt = buildPrompt(`URL: ${url}`)

  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const result = await model.generateContent(prompt)
      clearTimeout(timeoutId)

      const response = await result.response
      const text = response.text()

      return parseAndValidateResponse(text)
    } catch (error: any) {
      lastError = error

      // Handle rate limiting (429)
      if (error?.message?.includes('429') || error?.message?.toLowerCase().includes('quota')) {
        if (attempt < maxRetries) {
          console.warn(`Rate limit hit, retrying in ${retryDelay}ms... (attempt ${attempt}/${maxRetries})`)
          await sleep(retryDelay * attempt) // Exponential backoff
          continue
        }
        throw new RateLimitError()
      }

      // Handle timeout
      if (error.name === 'AbortError') {
        throw new GeminiAPIError(`Request timed out after ${timeout}ms`, 'TIMEOUT')
      }

      // Don't retry on other errors
      break
    }
  }

  // If we exhausted retries or hit a non-retriable error
  throw new GeminiAPIError(
    `Failed to parse job posting from URL: ${lastError?.message || 'Unknown error'}`,
    'PARSE_FAILED'
  )
}

/**
 * Parse job posting from text content (Fallback Method)
 * 
 * Accepts text content and sends to Gemini for parsing
 * 
 * @param content - Job posting text content
 * @param options - Parse options
 * @returns Parsed job data
 */
export async function parseJobPostingFromText(
  content: string,
  options: ParseOptions = {}
): Promise<ParsedJobData> {
  if (!genAI) {
    throw new GeminiAPIError("Gemini API key not configured", "API_KEY_MISSING")
  }

  if (!content || content.trim().length < 50) {
    throw new GeminiAPIError(
      "Content is too short or empty. Please provide at least 50 characters.",
      "INVALID_CONTENT"
    )
  }

  const {
    timeout = 30000,
    maxRetries = 3,
    retryDelay = 1000
  } = options

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  })

  const prompt = buildPrompt(content)

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const result = await model.generateContent(prompt)
      clearTimeout(timeoutId)

      const response = await result.response
      const text = response.text()

      return parseAndValidateResponse(text)
    } catch (error: any) {
      lastError = error

      // Handle rate limiting
      if (error?.message?.includes('429') || error?.message?.toLowerCase().includes('quota')) {
        if (attempt < maxRetries) {
          console.warn(`Rate limit hit, retrying in ${retryDelay}ms... (attempt ${attempt}/${maxRetries})`)
          await sleep(retryDelay * attempt)
          continue
        }
        throw new RateLimitError()
      }

      // Handle timeout
      if (error.name === 'AbortError') {
        throw new GeminiAPIError(`Request timed out after ${timeout}ms`, 'TIMEOUT')
      }

      break
    }
  }

  throw new GeminiAPIError(
    `Failed to parse job posting from text: ${lastError?.message || 'Unknown error'}`,
    'PARSE_FAILED'
  )
}

/**
 * Legacy function for backward compatibility
 * Defaults to text parsing
 */
export async function parseJobPosting(
  content: string,
  options?: ParseOptions
): Promise<ParsedJobData> {
  return parseJobPostingFromText(content, options)
}

/**
 * Build optimized prompt for job posting extraction
 */
function buildPrompt(content: string): string {
  return `You are a job posting parser. Extract structured information from the following job posting and return ONLY a valid JSON object.

Job Posting:
${content}

Extract the following fields and return as JSON:
{
  "company_name": "string or null",
  "job_title": "string or null",
  "opportunity_type": "internship|full_time|research|fellowship|scholarship|null",
  "role_type": "string or null",
  "relevant_majors": ["array of strings"] or null,
  "deadline": "YYYY-MM-DD or null",
  "requirements": "string or null",
  "location": "string or null",
  "description": "string or null",
  "offers_sponsorship": true|false|null,
  "requires_us_citizenship": true|false|null
}

Instructions:
1. CRITICAL - HTML CLEANING: If the content contains HTML tags like <h1>, <p>, <ul>, <li>, <strong>, <em>, <a>, etc., you MUST strip them completely and return ONLY clean text. DO NOT include any HTML formatting in your response. Remove all tags and inline styles.

2. company_name: Extract the company or organization name.
   - Look in page title, headers, or URL if not explicitly stated
   - For manual content, look at the VERY TOP of the text - company name is often the first line
   - Check for patterns like "CompanyName\\nJob Title" at the start
   - Look for explicit mentions like "Join [Company]", "About [Company]", "at [Company]"
   - If you see a single word or short phrase at the very beginning before the job title, it's likely the company name

3. job_title: Extract the EXACT job/position title as written in the posting. DO NOT simplify, shorten, or interpret it.
   - Look for the main job title in the page header, title tag, or "Job description" section heading
   - Examples: "Explore Program Internship Opportunities: First-Year Students" should stay as is, NOT be simplified to "Software Engineer Intern"
   - "Software Engineering Manager Intern - Core Platform and Tools" should stay as is, NOT be shortened
   - If the title includes location (e.g., "Redmond"), include it: "Explore Program Internship Opportunities: First-Year Students, Redmond"
   - Extract the complete, verbatim title from the job posting header or title field
   - CRITICAL: Do NOT use generic descriptions like "Software Engineering Intern" when a specific program name exists (e.g., "Explore Program")

4. opportunity_type: Classify as one of: internship, full_time, research, fellowship, or scholarship
   - Use "internship" for summer internships, co-ops, intern positions, "intern" keywords
   - Use "full_time" for full-time jobs, permanent positions, "full-time" keywords
   - Use "research" for research positions, research assistantships, "research" keywords
   - Use "fellowship" for fellowship programs
   - Use "scholarship" for scholarships, grants

5. role_type: Extract or infer the general role category (e.g., "Software Engineering", "Product Management", "Data Science", "Marketing", etc.).
   - This is different from job_title - it's the broader category
   - Example: "Explore Program Internship" -> role_type: "Software Engineering" (if it's for SWE)
   - Example: "Software Engineering Manager Intern" -> role_type: "Software Engineering Management"

6. relevant_majors: Extract list of relevant academic majors or fields of study. Look for mentions of degrees, majors, or fields
   - Format each major with proper Title Case capitalization (e.g., "Computer Science", "Software Engineering", "Electrical Engineering")
   - Convert lowercase majors like "computer science" to "Computer Science"
   - Convert uppercase majors like "COMPUTER SCIENCE" to "Computer Science"

7. deadline: Extract application deadline in YYYY-MM-DD format. Parse dates like "December 15, 2025" as "2025-12-15". Look for "deadline", "apply by", "closing date" keywords

8. requirements: Extract ALL requirements EXACTLY as written in the posting. DO NOT rewrite, rephrase, or restructure them.
   - Look for sections with ANY of these headings: "Requirements", "Qualifications", "Required Qualifications", "Preferred Qualifications", "Skills You'll Need", "Skills You'll Need To Bring", "What You'll Need", "What You'll Achieve", "What We're Looking For", "Who We're Looking For", "Minimum Qualifications", "Preferred Skills", "Required Skills", "Must Have", "Nice to Have", "Responsibilities"
   - Copy the exact wording from these sections
   - Format as newline-separated list: "First requirement here\nSecond requirement here\nThird requirement here"
   - Each line should be a distinct requirement or qualification AS WRITTEN in the original posting
   - Separate different requirements with \\n (newline character)
   - Do NOT combine multiple requirements into one long sentence
   - Do NOT rewrite requirements to sound "better" - keep the original wording
   - Include both required and preferred qualifications as separate lines
   - Strip any HTML tags (like <li>, <p>, <strong>, <em>) and return clean text only
   - Example: If posting says "Currently pursuing full time Bachelor's degree" -> use that EXACT text, NOT "Bachelor's degree required"

9. location: Extract the COMPLETE job location with as much detail as provided (city, state, country, or "Remote").
   - Example: "United States, Washington, Redmond" NOT just "United States"
   - Example: "San Francisco, California, United States" NOT just "United States"
   - Include all location details found in the posting
   - Look for location mentions in headers, "based in", "located in", or remote indicators

10. description: Extract the job description EXACTLY as written in the posting. DO NOT rewrite or paraphrase.
   - Copy text from "Overview", "Description", "Responsibilities", "About The Role", "What You'll Do", or similar sections
   - Preserve the original wording and structure from the posting
   - If there are multiple sections (Overview, Responsibilities, etc.), combine them with line breaks
   - Only summarize if the description is extremely long (>500 words) - otherwise use exact text
   - Do NOT add your own interpretation or rewrite in "better" language
   - CRITICAL: Strip all HTML tags completely. Remove <h1>, <h2>, <p>, <ul>, <li>, <strong>, <em>, <a>, and all other HTML formatting. Return ONLY clean, readable text.
   - Remove inline styles like style="min-height:1.5em"
   - Convert HTML lists to text lists using newlines or bullet points

11. offers_sponsorship: CAREFULLY detect if visa/work sponsorship is offered or NOT offered

   Set to TRUE (offers sponsorship) if you find ANY of these phrases:
   * "visa sponsorship available", "visa sponsorship provided", "visa sponsorship offered"
   * "will sponsor", "we sponsor", "can sponsor", "may sponsor", "sponsorship offered"
   * "H1B sponsorship", "H-1B sponsorship", "OPT sponsorship", "CPT sponsorship"
   * "work authorization provided", "will provide work authorization"
   * "sponsorship for work authorization", "immigration sponsorship"
   * "sponsor eligible candidates", "sponsorship may be available"

   Set to FALSE (does NOT offer sponsorship) ONLY if you find EXPLICIT statements like:
   * "no sponsorship", "sponsorship not available", "sponsorship not provided", "sponsorship not offered"
   * "cannot sponsor", "does not sponsor", "will not sponsor", "unable to sponsor", "not able to sponsor"
   * "we do not provide visa sponsorship", "visa sponsorship is not available"
   * "sponsorship will not be provided", "unable to provide sponsorship"
   * "must be eligible to work WITHOUT sponsorship", "work without company sponsorship"
   * "must possess work authorization that does not require sponsorship"
   * "authorized to work without sponsorship", "no visa sponsorship", "without need for sponsorship"
   * "must be able to work without sponsorship", "able to work legally without sponsorship"

   NEUTRAL PHRASES - Do NOT treat these as "no sponsorship" because they apply to EVERYONE including visa holders:
   * "must be authorized to work" - H1B, OPT, and CPT holders ARE authorized to work
   * "legally authorized to work" - visa holders ARE legally authorized
   * "work authorization required" - sponsorship PROVIDES work authorization
   * "employment eligibility verification" - standard I-9 form for ALL employees
   * "valid work authorization" - visas ARE valid work authorization
   * "currently authorized to work" - current visa holders ARE currently authorized
   * "must have work authorization" - this does NOT exclude sponsored workers

   KEY INSIGHT: Companies that sponsor visas still require "work authorization" because the visa IS the authorization.
   The key difference is between:
   - "must have work authorization" (NEUTRAL - includes sponsored workers)
   - "must have work authorization WITHOUT sponsorship" (NO SPONSORSHIP - explicit exclusion)

   IMPORTANT NOTES:
   * "Equal Opportunity Employer", "EEO", "EOE", "AA/EEO" statements do NOT indicate anything about sponsorship - ignore these completely

   * CRITICAL - SCREENING QUESTIONS ARE NOT POLICY STATEMENTS:
     - Questions like "will you require sponsorship?" or "do you need sponsorship?" are APPLICATION SCREENING QUESTIONS
     - These are standard questions companies ask ALL applicants to collect data
     - Just because a company ASKS about sponsorship needs does NOT mean they DON'T offer sponsorship
     - Many companies that DO offer sponsorship still ask these questions to plan ahead
     - IGNORE ALL SCREENING QUESTIONS when determining sponsorship availability
     - Examples to IGNORE: "Will you now or in the future require sponsorship?", "Do you need visa sponsorship?", "Are you authorized to work in the US?"

   * Only EXPLICIT POLICY STATEMENTS should affect the sponsorship field:
     - "We cannot provide sponsorship" = FALSE (explicit policy)
     - "Sponsorship is not available" = FALSE (explicit policy)
     - "We do not sponsor visas" = FALSE (explicit policy)
     - "Will you need sponsorship?" = IGNORE (screening question, not policy)
     - "Are you currently authorized to work?" = IGNORE (screening question, not policy)

   * If BOTH positive and negative POLICY indicators exist, the negative (no sponsorship) takes precedence
   * DEFAULT BEHAVIOR: If no clear negative POLICY statement is found, default to TRUE (assume sponsorship is available)
   * Only set to FALSE if you find EXPLICIT policy statements that sponsorship is NOT offered
   * When in doubt about whether something is a question vs a statement, default to TRUE

12. requires_us_citizenship: CAREFULLY detect if U.S. citizenship is required or NOT required

   Set to TRUE (citizenship IS required) if you find ANY of these phrases:
   * "U.S. citizenship required", "US citizenship required", "United States citizenship required"
   * "must be a U.S. citizen", "must be a US citizen", "must be US citizen", "U.S. citizens only"
   * "citizenship required", "US citizen only", "only US citizens", "restricted to US citizens"
   * "security clearance required", "clearance required", "active security clearance", "must have clearance"
   * "secret clearance", "top secret clearance", "TS/SCI", "TS clearance", "SCI clearance"
   * "federal government", "DOD", "Department of Defense", "DoD contractor", "government clearance"
   * "must be a US national", "U.S. national", "US Person", "must be US Person"
   * "ability to obtain security clearance", "eligible for security clearance" (implies citizenship)
   * "ITAR", "International Traffic in Arms Regulations" (often requires US citizenship)
   * "Export Control", "export compliance" (when combined with citizenship language)
   * "must be a citizen of the United States"

   Set to FALSE (citizenship NOT required) if you find ANY of these phrases:
   * "no citizenship required", "citizenship not required", "US citizenship not required"
   * "open to all", "international applicants welcome", "international students welcome", "international candidates welcome"
   * "non-citizens may apply", "non-US citizens may apply", "citizenship not necessary"
   * "visa sponsorship available", "will sponsor", "H1B sponsorship" (strongly implies non-citizens can apply)
   * "Green Card holders welcome", "permanent residents eligible", "lawful permanent residents"
   * "all qualified applicants", "regardless of citizenship status"

   IMPORTANT NOTES:
   * "Equal Opportunity Employer", "EEO", "EOE", "AA/EEO" statements do NOT mean citizenship is required - ignore these completely
   * Security clearance almost always requires US citizenship - this is a strong indicator
   * DOD, federal government positions usually require citizenship unless explicitly stated otherwise
   * If BOTH positive and negative indicators exist, the positive (requires citizenship) takes precedence
   * DEFAULT BEHAVIOR: If no clear positive indicators are found, default to FALSE (assume citizenship is NOT required unless explicitly stated)
   * Only set to TRUE if you find explicit evidence that citizenship IS required

Rules:
- Return ONLY valid JSON, no markdown, no code blocks, no explanations
- CRITICAL: Extract information VERBATIM from the posting - DO NOT rewrite, rephrase, or restructure content
- Your role is to EXTRACT, not to REWRITE or IMPROVE the text
- Preserve the exact wording from the job posting for all fields (except formatting requirements like dates)
- Be AGGRESSIVE in extracting information - look for any clues in the content
- If information is partially available, extract what you can find
- For requirements: Format as newline-separated list with \\n between each requirement. Each line = one requirement. Use EXACT wording from posting.
- For description: Use EXACT text from posting. Only summarize if extremely long (>500 words).
- Use null ONLY if absolutely no information can be found for a field
- For dates, always use YYYY-MM-DD format (this is the ONLY field where reformatting is allowed)
- For relevant_majors, return an array even if only one major is found
- Be thorough and extract as much information as possible WITHOUT changing the original meaning or wording

EXAMPLES FOR SPONSORSHIP & CITIZENSHIP DETECTION:

Example 1 - NO SPONSORSHIP:
Text: "Applicants must be currently authorized to work in the United States on a full-time basis."
Result: offers_sponsorship: false, requires_us_citizenship: null

Example 2 - OFFERS SPONSORSHIP:
Text: "We provide H1B visa sponsorship for qualified candidates."
Result: offers_sponsorship: true, requires_us_citizenship: false

Example 3 - REQUIRES CITIZENSHIP (Security Clearance):
Text: "This position requires the ability to obtain a Secret security clearance."
Result: offers_sponsorship: false, requires_us_citizenship: true

Example 4 - REQUIRES CITIZENSHIP (DOD):
Text: "This is a Department of Defense contractor position."
Result: offers_sponsorship: false, requires_us_citizenship: true

Example 5 - NO SPONSORSHIP (Explicit):
Text: "We are unable to provide visa sponsorship at this time."
Result: offers_sponsorship: false, requires_us_citizenship: null

Example 6 - INTERNATIONAL WELCOME:
Text: "We welcome applications from international students. Visa sponsorship is available."
Result: offers_sponsorship: true, requires_us_citizenship: false

Example 7 - CITIZENSHIP REQUIRED (Explicit):
Text: "U.S. citizenship is required for this role."
Result: offers_sponsorship: false, requires_us_citizenship: true

Example 8 - AMBIGUOUS (EEO Statement - Use Defaults):
Text: "We are an Equal Opportunity Employer committed to diversity."
Result: offers_sponsorship: true, requires_us_citizenship: false

Example 9 - NO SPONSORSHIP (Work Authorization):
Text: "Candidates must possess work authorization that does not require sponsorship by the employer."
Result: offers_sponsorship: false, requires_us_citizenship: false

Example 10 - GREEN CARD HOLDERS OK:
Text: "Open to U.S. citizens and Green Card holders only."
Result: offers_sponsorship: false, requires_us_citizenship: false

Example 11 - SCREENING QUESTION (Default to TRUE):
Text: "Will you now or in the future require the company's sponsorship for an immigration-related employment benefit (i.e., a work visa, work permit, etc.)?"
Result: offers_sponsorship: true, requires_us_citizenship: false
Reason: This is just a screening question, NOT a statement that they don't offer sponsorship

Example 12 - MAJOR TECH COMPANY (No explicit statement):
Text: "Microsoft is hiring Software Engineers. Must be enrolled in a US university."
Result: offers_sponsorship: true, requires_us_citizenship: false
Reason: No explicit "no sponsorship" statement found, so default to TRUE

Example 13 - EXACT JOB TITLE (Microsoft Explore):
Text: "Explore Program Internship Opportunities: First-Year Students, Redmond. Profession: Software Engineering."
Result:
{
  "job_title": "Explore Program Internship Opportunities: First-Year Students, Redmond",
  "role_type": "Software Engineering",
  "offers_sponsorship": true
}
Reason: job_title is the EXACT title from the posting, NOT "Software Engineering Intern". role_type is the broader category.

Example 14 - MAJOR CAPITALIZATION:
Text: "Majors: computer science, software engineering, computer engineering, or related field"
Result:
{
  "relevant_majors": ["Computer Science", "Software Engineering", "Computer Engineering"]
}
Reason: All majors formatted with proper Title Case capitalization, NOT lowercase.

Return the JSON now:`
}

/**
 * Parse and validate AI response
 */
function parseAndValidateResponse(text: string): ParsedJobData {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.trim()
    cleanText = cleanText.replace(/```json\n?/g, '')
    cleanText = cleanText.replace(/```\n?/g, '')
    cleanText = cleanText.trim()

    // Find JSON object in response
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON object found in AI response")
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedJobData

    // Validate and normalize data
    const validated: ParsedJobData = {
      company_name: normalizeString(parsed.company_name),
      job_title: normalizeString(parsed.job_title),
      opportunity_type: normalizeOpportunityType(parsed.opportunity_type),
      role_type: normalizeString(parsed.role_type),
      relevant_majors: normalizeArray(parsed.relevant_majors),
      deadline: normalizeDate(parsed.deadline),
      requirements: stripHtml(normalizeString(parsed.requirements)),
      location: normalizeString(parsed.location),
      description: stripHtml(normalizeString(parsed.description)),
      // Default: offers_sponsorship = true (unless explicitly stated no sponsorship)
      offers_sponsorship: normalizeBoolean(parsed.offers_sponsorship, true),
      // Default: requires_us_citizenship = false (unless explicitly stated citizenship required)
      requires_us_citizenship: normalizeBoolean(parsed.requires_us_citizenship, false),
    }

    return validated
  } catch (error: any) {
    throw new GeminiAPIError(
      `Failed to parse AI response: ${error.message}`,
      'INVALID_RESPONSE'
    )
  }
}

/**
 * Normalize string fields
 */
function normalizeString(value: any): string | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Normalize array fields
 */
function normalizeArray(value: any): string[] | null {
  if (!value) return null
  if (Array.isArray(value)) {
    const filtered = value
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim())
    return filtered.length > 0 ? filtered : null
  }
  return null
}

/**
 * Normalize opportunity type
 */
function normalizeOpportunityType(value: any): ParsedJobData['opportunity_type'] {
  if (!value || typeof value !== 'string') return null
  
  const normalized = value.toLowerCase().trim()
  const validTypes = ['internship', 'full_time', 'research', 'fellowship', 'scholarship']
  
  if (validTypes.includes(normalized)) {
    return normalized as ParsedJobData['opportunity_type']
  }
  
  return null
}

/**
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(value: any): string | null {
  if (!value || typeof value !== 'string') return null
  
  const trimmed = value.trim()
  
  // Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    // Validate it's a real date
    const date = new Date(trimmed)
    if (!isNaN(date.getTime())) {
      return trimmed
    }
  }
  
  // Try to parse other date formats
  try {
    const date = new Date(trimmed)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch {
    // Parsing failed
  }
  
  return null
}

/**
 * Normalize boolean fields with smart defaults
 * @param value - The value to normalize
 * @param defaultValue - Default value if null/undefined (true or false)
 */
function normalizeBoolean(value: any, defaultValue: boolean = false): boolean {
  if (value === null || value === undefined) return defaultValue
  if (typeof value === 'boolean') return value

  // Handle string representations
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    if (lower === 'true') return true
    if (lower === 'false') return false
  }

  return defaultValue
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Strip HTML tags and decode entities from text
 * Safety net in case Gemini returns HTML-formatted content
 */
function stripHtml(text: string | null): string | null {
  if (!text) return text
  
  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Clean up excessive whitespace
    .replace(/\s+/g, ' ')
    // Clean up excessive newlines (but preserve double newlines for paragraphs)
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
}


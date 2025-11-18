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
1. company_name: Extract the company or organization name. Look in page title, headers, or URL if not explicitly stated.
2. job_title: Extract the job/position title. Look for titles like "Software Engineer", "Intern", "Research Assistant", etc.
3. opportunity_type: Classify as one of: internship, full_time, research, fellowship, or scholarship
   - Use "internship" for summer internships, co-ops, intern positions, "intern" keywords
   - Use "full_time" for full-time jobs, permanent positions, "full-time" keywords
   - Use "research" for research positions, research assistantships, "research" keywords
   - Use "fellowship" for fellowship programs
   - Use "scholarship" for scholarships, grants
4. role_type: Extract the role category (e.g., "Software Engineering", "Product Management", "Data Science", "Marketing", etc.) from job title or description
5. relevant_majors: Extract list of relevant academic majors or fields of study. Look for mentions of degrees, majors, or fields
6. deadline: Extract application deadline in YYYY-MM-DD format. Parse dates like "December 15, 2025" as "2025-12-15". Look for "deadline", "apply by", "closing date" keywords
7. requirements: Extract ALL key requirements including education, experience, skills, qualifications. Format as a newline-separated list where EACH requirement is on its own line. Example format:
   "First requirement here\nSecond requirement here\nThird requirement here"
   - Each line should be a distinct requirement or qualification
   - Separate different requirements with \\n (newline character)
   - Do NOT combine multiple requirements into one long sentence
   - Include preferred qualifications as separate lines if available
8. location: Extract job location (city, state, country, or "Remote"). Look for location mentions, "based in", "located in", or remote indicators
9. description: Extract a comprehensive job description. Include what the role involves, responsibilities, and what the company is looking for. If full description isn't available, create a brief summary based on available information.
10. offers_sponsorship: CAREFULLY detect if visa/work sponsorship is offered or NOT offered

   Set to TRUE (offers sponsorship) if you find ANY of these phrases:
   * "visa sponsorship available", "visa sponsorship provided", "visa sponsorship offered"
   * "will sponsor", "we sponsor", "can sponsor", "may sponsor", "sponsorship offered"
   * "H1B sponsorship", "H-1B sponsorship", "OPT sponsorship", "CPT sponsorship"
   * "work authorization provided", "will provide work authorization"
   * "sponsorship for work authorization", "immigration sponsorship"
   * "sponsor eligible candidates", "sponsorship may be available"

   Set to FALSE (does NOT offer sponsorship) if you find ANY of these phrases:
   * "no sponsorship", "sponsorship not available", "sponsorship not provided", "sponsorship not offered"
   * "cannot sponsor", "does not sponsor", "will not sponsor", "unable to sponsor", "not able to sponsor"
   * "must be authorized to work", "must have authorization to work", "must possess authorization to work"
   * "must have work authorization", "work authorization required", "current work authorization required"
   * "must be legally authorized to work", "legally authorized to work", "currently authorized to work"
   * "must be eligible to work without sponsorship", "eligible to work without company sponsorship"
   * "must possess work authorization that does not require sponsorship"
   * "authorized to work without sponsorship", "no visa sponsorship", "without need for sponsorship"
   * "must be able to work without sponsorship", "able to work legally without sponsorship"
   * "employment eligibility verification required", "I-9 employment eligibility" (when combined with work auth language)
   * "permanently authorized to work", "permanent work authorization required"
   * "US work authorization required", "valid US work authorization"

   IMPORTANT NOTES:
   * "Equal Opportunity Employer", "EEO", "EOE", "AA/EEO" statements do NOT indicate anything about sponsorship - ignore these completely
   * If BOTH positive and negative indicators exist, the negative (no sponsorship) takes precedence
   * DEFAULT BEHAVIOR: If no clear negative indicators are found, default to TRUE (assume sponsorship is available unless explicitly stated otherwise)
   * Only set to FALSE if you find explicit evidence that sponsorship is NOT offered

11. requires_us_citizenship: CAREFULLY detect if U.S. citizenship is required or NOT required

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
- Be AGGRESSIVE in extracting information - look for any clues in the content
- If information is partially available, extract what you can find
- For requirements: Format as newline-separated list with \\n between each requirement. Each line = one requirement. DO NOT create one long paragraph.
- For description: Provide a comprehensive description (3-5 sentences) if possible, or at least 2 sentences
- Use null ONLY if absolutely no information can be found for a field
- For dates, always use YYYY-MM-DD format
- For relevant_majors, return an array even if only one major is found
- Be thorough and extract as much information as possible

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
      requirements: normalizeString(parsed.requirements),
      location: normalizeString(parsed.location),
      description: normalizeString(parsed.description),
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


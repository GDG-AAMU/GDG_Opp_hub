/**
 * Content Filter for Gemini
 * Final cleanup before sending content to AI for parsing
 */

/**
 * Navigation/footer patterns to remove from content
 */
const NAVIGATION_PATTERNS = [
  /home|about|careers|contact|sign in|log in/gi,
  /privacy|terms|cookie|legal/gi,
  /© \d{4}|all rights reserved/gi,
  /skip to content|skip navigation/gi,
  /back to top|scroll to top/gi,
  /follow us|connect with us/gi,
  /subscribe|newsletter/gi,
]

/**
 * Common navigation phrases (remove if content is mostly these)
 */
const NAVIGATION_PHRASES = [
  'home',
  'about us',
  'contact us',
  'privacy policy',
  'terms of service',
  'cookie policy',
  'sign in',
  'log in',
  'sign up',
  'register',
  'all rights reserved',
  'copyright',
  'follow us on',
  'connect with us',
]

/**
 * Validates if content looks like a job description
 */
export function isValidJobContent(content: string): boolean {
  if (!content || content.trim().length < 100) return false

  const lowerContent = content.toLowerCase()

  // Must have job-related keywords
  const jobKeywords = [
    'requirements',
    'qualifications',
    'responsibilities',
    'deadline',
    'apply',
    'position',
    'role',
    'internship',
    'full-time',
    'part-time',
    'location',
    'experience',
    'education',
    'degree',
    'skills',
  ]

  const hasJobKeywords = jobKeywords.some((keyword) => lowerContent.includes(keyword))

  if (!hasJobKeywords) return false

  // Must NOT be mostly navigation
  const navCount = NAVIGATION_PHRASES.filter((phrase) => lowerContent.includes(phrase)).length

  if (navCount > 3) return false // Too many nav phrases

  // Check if content has structure (paragraphs, lists)
  const hasStructure = content.includes('\n\n') || content.match(/\d+\./) || content.match(/[-•*]/)

  if (!hasStructure && content.length < 300) return false // Too short and unstructured

  return true
}

/**
 * Removes navigation patterns from content
 */
function removeNavigationPatterns(content: string): string {
  let cleaned = content

  // Remove navigation patterns
  NAVIGATION_PATTERNS.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, '')
  })

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ')
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n')

  return cleaned.trim()
}

/**
 * Extracts job-relevant sections from content
 */
function extractJobSections(content: string): string {
  const lines = content.split('\n')
  const relevantLines: string[] = []
  let inJobSection = false

  const jobSectionMarkers = [
    'requirements',
    'qualifications',
    'responsibilities',
    'job description',
    'position',
    'role',
    'about the role',
    'what you will do',
    'what we are looking for',
  ]

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim()

    // Check if this line starts a job section
    const isJobSectionStart = jobSectionMarkers.some((marker) => lowerLine.includes(marker))

    if (isJobSectionStart) {
      inJobSection = true
    }

    // If we're in a job section or line is substantial, include it
    if (inJobSection || line.trim().length > 50) {
      relevantLines.push(line)

      // Stop if we hit navigation markers
      const isNavMarker = ['home', 'about us', 'contact', 'privacy', 'terms'].some((marker) =>
        lowerLine.includes(marker)
      )

      if (isNavMarker && !isJobSectionStart) {
        break
      }
    }
  }

  return relevantLines.join('\n')
}

/**
 * Filters content for Gemini
 * Removes noise and validates quality before sending to AI
 */
export function filterContentForGemini(content: string): string {
  if (!content || content.trim().length < 50) {
    return ''
  }

  // Step 1: Remove navigation patterns
  let cleaned = removeNavigationPatterns(content)

  // Step 2: Extract job-relevant sections
  cleaned = extractJobSections(cleaned)

  // Step 3: Validate content quality
  if (!isValidJobContent(cleaned)) {
    // If validation fails, try to salvage by taking first substantial chunk
    const lines = cleaned.split('\n').filter((line) => line.trim().length > 20)
    const substantialLines = lines.slice(0, 20) // Take first 20 substantial lines
    cleaned = substantialLines.join('\n')
  }

  // Step 4: Final cleanup
  cleaned = cleaned.trim()

  // Remove excessive whitespace again
  cleaned = cleaned.replace(/\s+/g, ' ')
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n')

  return cleaned
}

/**
 * Gets a preview of content (first N characters)
 * Useful for logging/debugging
 */
export function getContentPreview(content: string, maxLength: number = 200): string {
  if (!content) return ''
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}


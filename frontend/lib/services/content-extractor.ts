/**
 * Smart Content Extractor
 * Removes navigation/footer elements and extracts main job description content
 */

import * as cheerio from 'cheerio'

/**
 * Elements to ALWAYS remove (navigation, footer, sidebar, etc.)
 */
const NOISE_SELECTORS = [
  'nav',
  'header',
  'footer',
  'aside',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '[role="complementary"]',
  '.navbar',
  '.header',
  '.footer',
  '.sidebar',
  '.menu',
  '.navigation',
  '.nav-menu',
  '.breadcrumb',
  '.breadcrumbs',
  '.social-links',
  '.share-buttons',
  '.cookie-banner',
  '.privacy-notice',
  '.newsletter',
  '.subscribe',
  '.advertisement',
  '.ads',
  '[class*="nav"]',
  '[class*="menu"]',
  '[class*="footer"]',
  '[class*="header"]',
  '[id*="nav"]',
  '[id*="menu"]',
  '[id*="footer"]',
  '[id*="header"]',
]

/**
 * Site-specific selectors for major job platforms
 * Ordered by priority/specificity
 */
const SITE_SPECIFIC_SELECTORS: Record<string, string[]> = {
  'amazon.jobs': [
    '.job-description-container',
    '[data-testid="job-description"]',
    '.job-detail-description',
    '.job-description-content',
    '[class*="job-description"]',
  ],
  'jobs.bnsf.com': [
    '.job-details',
    '.job-description',
    '.job-content',
    '[class*="job-detail"]',
  ],
  'google.com': [
    '.job-description',
    '.job-content',
    '[data-job-description]',
    '[class*="job-description"]',
  ],
  'greenhouse.io': [
    '.content',
    '.description',
    '[id*="content"]',
    '[id*="description"]',
  ],
  'lever.co': [
    '.content',
    '.description',
    '[class*="content"]',
  ],
  'workday.com': [
    '.job-description',
    '.job-content',
    '[class*="job-description"]',
  ],
}

/**
 * Generic content selectors (fallback)
 * Ordered by priority
 */
const GENERIC_CONTENT_SELECTORS = [
  'article',
  'main',
  '[role="main"]',
  '.job-description',
  '.job-content',
  '.job-details',
  '.posting-description',
  '.description',
  '.content',
  '#job-description',
  '#job-content',
  '#description',
  '#content',
  '[class*="job"]',
  '[class*="description"]',
  '[class*="content"]',
]

/**
 * Scores content quality
 * Higher score = more likely to be a job description
 */
function scoreContent(text: string): number {
  if (!text || text.trim().length < 50) return 0

  let score = 0
  const lowerText = text.toLowerCase()

  // Job-related keywords (positive)
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
    'salary',
    'benefits',
    'experience',
    'education',
    'degree',
    'skills',
    'candidate',
    'applicant',
  ]
  jobKeywords.forEach((keyword) => {
    const count = (lowerText.match(new RegExp(keyword, 'g')) || []).length
    score += count * 10
  })

  // Navigation keywords (negative)
  const navKeywords = [
    'home',
    'about',
    'contact',
    'privacy',
    'terms',
    'cookie',
    'sign in',
    'log in',
    'sign up',
    'register',
    'all rights reserved',
    'copyright',
  ]
  navKeywords.forEach((keyword) => {
    const count = (lowerText.match(new RegExp(keyword, 'g')) || []).length
    score -= count * 20
  })

  // Length bonus (job descriptions are usually 200+ chars)
  if (text.length > 200) score += 20
  if (text.length > 500) score += 30
  if (text.length > 1000) score += 40
  if (text.length > 2000) score += 50

  // Structure bonus (has paragraphs, lists)
  if (text.includes('\n\n')) score += 10
  if (text.match(/\d+\./)) score += 10 // Numbered lists
  if (text.match(/[-•*]/)) score += 10 // Bullet points
  if (text.match(/[A-Z][a-z]+:/)) score += 10 // Headers (e.g., "Requirements:")

  // Penalty for too many links (navigation indicator)
  const linkCount = (text.match(/https?:\/\//g) || []).length
  if (linkCount > 5) score -= 30

  return score
}

/**
 * Removes noise elements from HTML
 */
function removeNoiseElements(html: string): string {
  const $ = cheerio.load(html)

  // Remove all noise elements
  NOISE_SELECTORS.forEach((selector) => {
    try {
      $(selector).remove()
    } catch {
      // Ignore invalid selectors
    }
  })

  return $.html()
}

/**
 * Gets site-specific selectors for a URL
 */
function getSiteSpecificSelectors(url: string): string[] {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    for (const [domain, selectors] of Object.entries(SITE_SPECIFIC_SELECTORS)) {
      if (hostname.includes(domain)) {
        return selectors
      }
    }
  } catch {
    // Invalid URL, return empty
  }

  return []
}

/**
 * Extracts main job content from HTML
 * Removes navigation/footer and finds the best content block
 */
export function extractJobContent(html: string, url?: string): string {
  // Step 1: Remove noise elements
  const cleanedHtml = removeNoiseElements(html)
  const $ = cheerio.load(cleanedHtml)

  // Step 2: Get site-specific selectors if available
  const siteSelectors = url ? getSiteSpecificSelectors(url) : []
  const allSelectors = [...siteSelectors, ...GENERIC_CONTENT_SELECTORS]

  // Step 3: Try each selector and score the content
  let bestContent = ''
  let bestScore = 0

  for (const selector of allSelectors) {
    try {
      const elements = $(selector)

      if (elements.length > 0) {
        // Get text from first matching element
        const text = elements.first().text().trim()

        if (text.length >= 100) {
          // Score this content
          const score = scoreContent(text)

          if (score > bestScore) {
            bestScore = score
            bestContent = text
          }
        }
      }
    } catch {
      // Invalid selector, continue
      continue
    }
  }

  // Step 4: If no good content found, try body as last resort
  if (!bestContent || bestScore < 50) {
    const bodyText = $('body').text().trim()

    if (bodyText.length >= 100) {
      const bodyScore = scoreContent(bodyText)

      // Only use body if it scores reasonably well
      if (bodyScore > 30) {
        bestContent = bodyText
      }
    }
  }

  return bestContent || ''
}

/**
 * Validates if extracted content looks like a job description
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
  ]
  const hasJobKeywords = jobKeywords.some((keyword) => lowerContent.includes(keyword))

  if (!hasJobKeywords) return false

  // Must NOT be mostly navigation
  const navKeywords = ['home', 'about', 'contact', 'privacy', 'terms']
  const navCount = navKeywords.filter((keyword) => lowerContent.includes(keyword)).length

  if (navCount > 2) return false // Too many nav keywords

  // Check score
  const score = scoreContent(content)
  return score > 30 // Minimum score threshold
}


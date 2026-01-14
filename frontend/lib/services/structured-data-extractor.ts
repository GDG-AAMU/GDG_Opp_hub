/**
 * Structured Data Extractor
 * Extracts job posting data from Schema.org JSON-LD and microdata
 * This uses ZERO Gemini tokens - pure HTML parsing
 */

import * as cheerio from 'cheerio'
import { ParsedJobData } from '@/lib/ai/gemini'

/**
 * Extract structured data from HTML (JSON-LD and microdata)
 * Returns null if no structured data found (allows fallback to other methods)
 */
export function extractStructuredData(html: string): ParsedJobData | null {
  try {
    // Try JSON-LD first (most common)
    const jsonLdData = extractJsonLd(html)
    if (jsonLdData) {
      return jsonLdData
    }

    // Try microdata as fallback
    const microdata = extractMicrodata(html)
    if (microdata) {
      return microdata
    }

    return null
  } catch (error) {
    console.error('[StructuredData] Extraction error:', error)
    return null
  }
}

/**
 * Extract JSON-LD structured data
 */
function extractJsonLd(html: string): ParsedJobData | null {
  try {
    const $ = cheerio.load(html)
    const scripts = $('script[type="application/ld+json"]')

    for (let i = 0; i < scripts.length; i++) {
      const scriptContent = $(scripts[i]).html()
      if (!scriptContent) continue

      try {
        const jsonData = JSON.parse(scriptContent)
        const jobPosting = findJobPosting(jsonData)
        
        if (jobPosting) {
          return parseJsonLdJobPosting(jobPosting)
        }
      } catch (parseError) {
        // Invalid JSON, continue to next script
        continue
      }
    }

    return null
  } catch (error) {
    console.error('[StructuredData] JSON-LD extraction error:', error)
    return null
  }
}

/**
 * Find JobPosting in JSON-LD (handles arrays and nested objects)
 */
function findJobPosting(data: any): any {
  if (!data) return null

  // If it's a JobPosting directly
  if (data['@type'] === 'JobPosting' || data.type === 'JobPosting') {
    return data
  }

  // If it's an array
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findJobPosting(item)
      if (found) return found
    }
  }

  // If it has @graph (common in JSON-LD)
  if (data['@graph'] && Array.isArray(data['@graph'])) {
    for (const item of data['@graph']) {
      const found = findJobPosting(item)
      if (found) return found
    }
  }

  // Recursively search in object properties
  if (typeof data === 'object') {
    for (const key in data) {
      if (key === '@type' || key === 'type') continue
      const found = findJobPosting(data[key])
      if (found) return found
    }
  }

  return null
}

/**
 * Parse JSON-LD JobPosting into ParsedJobData format
 */
function parseJsonLdJobPosting(jobPosting: any): ParsedJobData {
  // Helper to extract text from string or object
  const extractText = (value: any): string | null => {
    if (!value) return null
    if (typeof value === 'string') return value.trim() || null
    if (typeof value === 'object' && value['@value']) return value['@value'].trim() || null
    if (typeof value === 'object' && value.name) return value.name.trim() || null
    if (typeof value === 'object' && value.text) return value.text.trim() || null
    return null
  }

  // Helper to extract date
  const extractDate = (value: any): string | null => {
    if (!value) return null
    const dateStr = typeof value === 'string' ? value : value['@value'] || value.datePublished || null
    if (!dateStr) return null
    
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return null
      return date.toISOString().split('T')[0] // YYYY-MM-DD
    } catch {
      return null
    }
  }

  // Helper to extract array
  const extractArray = (value: any): string[] | null => {
    if (!value) return null
    if (Array.isArray(value)) {
      return value.map(v => extractText(v)).filter((v): v is string => v !== null)
    }
    const text = extractText(value)
    return text ? [text] : null
  }

  // Extract job title
  const jobTitle = extractText(jobPosting.title) || extractText(jobPosting.name) || null

  // Extract company name
  const companyName = extractText(jobPosting.hiringOrganization?.name) || 
                     extractText(jobPosting.hiringOrganization) ||
                     extractText(jobPosting.employer?.name) ||
                     null

  // Extract description
  const description = extractText(jobPosting.description) || null

  // Extract location
  const location = extractText(jobPosting.jobLocation?.address?.addressLocality) ||
                  extractText(jobPosting.jobLocation?.address) ||
                  extractText(jobPosting.jobLocation) ||
                  extractText(jobPosting.workLocation) ||
                  null

  // Extract deadline (validThrough)
  const deadline = extractDate(jobPosting.validThrough) || extractDate(jobPosting.applicationDeadline) || null

  // Extract requirements/qualifications
  let requirements: string | null = null
  const qualifications = extractText(jobPosting.qualifications) || extractText(jobPosting.requirements)
  const skills = extractArray(jobPosting.skills) || extractArray(jobPosting.requiredSkills)
  const education = extractText(jobPosting.educationRequirements) || extractText(jobPosting.educationalRequirements)
  
  const reqParts: string[] = []
  if (qualifications) reqParts.push(qualifications)
  if (education) reqParts.push(`Education: ${education}`)
  if (skills && skills.length > 0) reqParts.push(`Skills: ${skills.join(', ')}`)
  if (reqParts.length > 0) {
    requirements = reqParts.join('\n')
  }

  // Determine opportunity type from employmentType
  const employmentType = extractText(jobPosting.employmentType)?.toLowerCase() || ''
  let opportunityType: ParsedJobData['opportunity_type'] = null
  if (employmentType.includes('intern') || employmentType.includes('internship')) {
    opportunityType = 'internship'
  } else if (employmentType.includes('full') || employmentType.includes('permanent')) {
    opportunityType = 'full_time'
  } else if (employmentType.includes('contract') || employmentType.includes('temporary')) {
    opportunityType = 'full_time' // Treat contract as full-time
  }

  // Extract role type from title or occupationalCategory
  const roleType = extractText(jobPosting.occupationalCategory) || 
                  extractText(jobPosting.jobTitle) ||
                  jobTitle?.split(' ').slice(0, 2).join(' ') || // First 2 words of title
                  null

  // Extract relevant majors (if available)
  const relevantMajors = extractArray(jobPosting.relevantMajor) || 
                       extractArray(jobPosting.relevantMajors) ||
                       null

  // Sponsorship and citizenship (defaults, can be overridden by AI parsing)
  const offersSponsorship = jobPosting.offersVisaSponsorship !== false // Default true unless explicitly false
  const requiresCitizenship = jobPosting.requiresCitizenship === true || 
                             jobPosting.requiresUSCitizenship === true ||
                             false

  return {
    company_name: companyName,
    job_title: jobTitle,
    opportunity_type: opportunityType,
    role_type: roleType,
    relevant_majors: relevantMajors,
    deadline: deadline,
    requirements: requirements,
    location: location,
    description: description,
    offers_sponsorship: offersSponsorship,
    requires_us_citizenship: requiresCitizenship,
  }
}

/**
 * Extract microdata structured data
 */
function extractMicrodata(html: string): ParsedJobData | null {
  try {
    const $ = cheerio.load(html)
    const jobPosting = $('[itemtype*="JobPosting"]').first()

    if (jobPosting.length === 0) {
      return null
    }

    // Extract properties
    const extractProperty = (prop: string): string | null => {
      const element = jobPosting.find(`[itemprop="${prop}"]`).first()
      if (element.length === 0) return null
      return element.text().trim() || element.attr('content') || null
    }

    const jobTitle = extractProperty('title') || extractProperty('name') || null
    const companyName = extractProperty('hiringOrganization') || 
                       jobPosting.find('[itemprop="hiringOrganization"] [itemprop="name"]').text().trim() ||
                       null
    const description = extractProperty('description') || null
    const location = extractProperty('jobLocation') || 
                    jobPosting.find('[itemprop="jobLocation"] [itemprop="addressLocality"]').text().trim() ||
                    null
    const deadline = extractProperty('validThrough') || null
    const requirements = extractProperty('qualifications') || extractProperty('requirements') || null

    if (!jobTitle || !companyName) {
      return null // Not enough data
    }

    // Determine opportunity type
    const employmentType = extractProperty('employmentType')?.toLowerCase() || ''
    let opportunityType: ParsedJobData['opportunity_type'] = null
    if (employmentType.includes('intern')) {
      opportunityType = 'internship'
    } else if (employmentType.includes('full')) {
      opportunityType = 'full_time'
    }

    return {
      company_name: companyName,
      job_title: jobTitle,
      opportunity_type: opportunityType,
      role_type: null,
      relevant_majors: null,
      deadline: deadline ? new Date(deadline).toISOString().split('T')[0] : null,
      requirements: requirements,
      location: location,
      description: description,
      offers_sponsorship: true, // Default
      requires_us_citizenship: false, // Default
    }
  } catch (error) {
    console.error('[StructuredData] Microdata extraction error:', error)
    return null
  }
}



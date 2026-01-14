/**
 * Job Data Validator
 * Validates extracted job data and detects generic company information
 */

import { ParsedJobData } from '@/lib/ai/gemini'

/**
 * Check if extracted data contains generic company information instead of specific job details
 */
export function isGenericInfo(parsedData: ParsedJobData): boolean {
  if (!parsedData) return true

  // Check job title - must be specific, not just generic words
  if (parsedData.job_title) {
    const title = parsedData.job_title.toLowerCase().trim()
    const genericTitlePatterns = [
      /^internship\s*program$/i,
      /^intern\s*program$/i,
      /^opportunity\s*program$/i,
      /^program$/i,
      /^internship$/i,
      /^intern$/i,
      /^opportunity$/i,
    ]
    
    // If title is only generic words without specifics, it's generic
    if (genericTitlePatterns.some(pattern => pattern.test(title))) {
      // Check if it has any specific details (location, role, etc.)
      const hasSpecifics = title.includes('engineering') ||
                          title.includes('software') ||
                          title.includes('research') ||
                          title.includes('data') ||
                          title.includes('product') ||
                          title.match(/\d{4}/) || // Year
                          title.match(/summer|fall|spring|winter/i) ||
                          title.length > 20 // Longer titles are usually more specific
      
      if (!hasSpecifics) {
        return true // Generic title
      }
    }
  } else {
    return true // No title = invalid
  }

  // Check description - must not start with generic company info
  if (parsedData.description) {
    const desc = parsedData.description.toLowerCase().trim()
    const genericStartPatterns = [
      /^welcome to/i,
      /^our company/i,
      /^we are/i,
      /^join us/i,
      /^at\s+[a-z]+\s+we/i,
      /^[a-z]+\s+is\s+a/i,
    ]
    
    if (genericStartPatterns.some(pattern => pattern.test(desc))) {
      // Check if description has job-specific content
      const hasJobSpecifics = desc.includes('responsibilities') ||
                             desc.includes('you will') ||
                             desc.includes('this role') ||
                             desc.includes('position') ||
                             desc.includes('candidate') ||
                             desc.length > 200 // Longer descriptions usually have specifics
      
      if (!hasJobSpecifics) {
        return true // Generic company description
      }
    }
  } else {
    return true // No description = invalid
  }

  // Check requirements - if present, should not be too generic
  if (parsedData.requirements) {
    const req = parsedData.requirements.toLowerCase()
    const genericReqPatterns = [
      /^currently enrolled/i,
      /^must be student/i,
      /^student/i,
      /^enrolled in/i,
    ]
    
    // If requirements are only generic statements without specifics
    if (genericReqPatterns.some(pattern => pattern.test(req)) && req.length < 100) {
      // Check if it has specific requirements
      const hasSpecifics = req.includes('degree') ||
                          req.includes('major') ||
                          req.includes('experience') ||
                          req.includes('skill') ||
                          req.includes('programming') ||
                          req.includes('language') ||
                          req.match(/\d+\s+year/i) || // "X years"
                          req.length > 150
      
      if (!hasSpecifics) {
        return true // Too generic
      }
    }
  }

  // Check location - "Global", "Various", "Multiple" without specifics is generic
  if (parsedData.location) {
    const location = parsedData.location.toLowerCase().trim()
    const genericLocations = ['global', 'various', 'multiple', 'remote', 'nationwide']
    if (genericLocations.includes(location) && !parsedData.description?.toLowerCase().includes('location')) {
      // If location is generic and description doesn't mention specific locations, might be generic
      // But don't reject just for this - location can be generic
    }
  }

  return false // Not generic
}

/**
 * Check if extracted data is valid and complete enough
 */
export function isValidJobData(parsedData: ParsedJobData | null): boolean {
  if (!parsedData) return false

  // Must have job title
  if (!parsedData.job_title || parsedData.job_title.trim().length < 3) {
    return false
  }

  // Must have company name
  if (!parsedData.company_name || parsedData.company_name.trim().length < 2) {
    return false
  }

  // Must have description
  if (!parsedData.description || parsedData.description.trim().length < 50) {
    return false
  }

  // Must have at least one of: requirements, location, or role_type
  const hasRequirements = parsedData.requirements && parsedData.requirements.trim().length > 20
  const hasLocation = parsedData.location && parsedData.location.trim().length > 2
  const hasRoleType = parsedData.role_type && parsedData.role_type.trim().length > 2

  if (!hasRequirements && !hasLocation && !hasRoleType) {
    return false // Not enough information
  }

  // Check if it's generic info (not specific job)
  if (isGenericInfo(parsedData)) {
    return false
  }

  return true
}

/**
 * Get validation error message if data is invalid
 */
export function getValidationError(parsedData: ParsedJobData | null): string | null {
  if (!parsedData) {
    return 'No data extracted'
  }

  if (!parsedData.job_title || parsedData.job_title.trim().length < 3) {
    return 'Job title is missing or too short'
  }

  if (!parsedData.company_name || parsedData.company_name.trim().length < 2) {
    return 'Company name is missing'
  }

  if (!parsedData.description || parsedData.description.trim().length < 50) {
    return 'Job description is missing or too short'
  }

  const hasRequirements = parsedData.requirements && parsedData.requirements.trim().length > 20
  const hasLocation = parsedData.location && parsedData.location.trim().length > 2
  const hasRoleType = parsedData.role_type && parsedData.role_type.trim().length > 2

  if (!hasRequirements && !hasLocation && !hasRoleType) {
    return 'Missing required information: requirements, location, or role type'
  }

  if (isGenericInfo(parsedData)) {
    return 'Extracted generic company information instead of specific job details'
  }

  return null
}



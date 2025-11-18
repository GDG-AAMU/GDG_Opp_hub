import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract company name from third-party job platform URLs
 * Many companies use platforms like Workday, Greenhouse, Lever for job postings
 * We need to extract the actual company name from the URL path
 */
function extractCompanyFromPlatformUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const pathname = urlObj.pathname.toLowerCase()

    // Workday patterns: company.wd1.myworkdayjobs.com or company.wd5.myworkdayjobs.com
    if (hostname.includes('myworkdayjobs.com')) {
      const match = hostname.match(/^([^.]+)\.wd\d+\.myworkdayjobs\.com/)
      if (match && match[1]) {
        return `${match[1]}.com`
      }
    }

    // Greenhouse patterns: boards.greenhouse.io/company or company.greenhouse.io
    if (hostname.includes('greenhouse.io')) {
      // Check subdomain first: company.greenhouse.io
      if (hostname !== 'boards.greenhouse.io') {
        const subdomain = hostname.split('.')[0]
        if (subdomain && subdomain !== 'www') {
          return `${subdomain}.com`
        }
      }
      // Check path: boards.greenhouse.io/company
      const pathMatch = pathname.match(/^\/([^\/]+)/)
      if (pathMatch && pathMatch[1]) {
        return `${pathMatch[1]}.com`
      }
    }

    // Lever patterns: jobs.lever.co/company
    if (hostname.includes('lever.co')) {
      const pathMatch = pathname.match(/^\/([^\/]+)/)
      if (pathMatch && pathMatch[1]) {
        return `${pathMatch[1]}.com`
      }
    }

    // SmartRecruiters patterns: jobs.smartrecruiters.com/company
    if (hostname.includes('smartrecruiters.com')) {
      const pathMatch = pathname.match(/^\/([^\/]+)/)
      if (pathMatch && pathMatch[1]) {
        return `${pathMatch[1]}.com`
      }
    }

    // Ashby patterns: jobs.ashbyhq.com/company
    if (hostname.includes('ashbyhq.com')) {
      const pathMatch = pathname.match(/^\/([^\/]+)/)
      if (pathMatch && pathMatch[1]) {
        return `${pathMatch[1]}.com`
      }
    }

    // BambooHR patterns: company.bamboohr.com
    if (hostname.includes('bamboohr.com')) {
      const subdomain = hostname.split('.')[0]
      if (subdomain && subdomain !== 'www') {
        return `${subdomain}.com`
      }
    }

    // iCIMS patterns: careers.icims.com/careers/jobs/company
    if (hostname.includes('icims.com')) {
      const pathMatch = pathname.match(/\/careers\/(?:jobs\/)?([^\/]+)/)
      if (pathMatch && pathMatch[1]) {
        return `${pathMatch[1]}.com`
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Extract the root domain from a URL, intelligently handling common job board subdomains
 * and third-party job platforms (Workday, Greenhouse, etc.)
 * @param url - The URL to extract the domain from
 * @returns The root domain without 'www.' prefix or job-related subdomains, or empty string if invalid
 * @example
 * extractDomain('https://www.google.com/jobs') // => 'google.com'
 * extractDomain('https://careers.microsoft.com') // => 'microsoft.com'
 * extractDomain('https://jobs.apple.com/en-us/details') // => 'apple.com'
 * extractDomain('https://walmart.wd5.myworkdayjobs.com/jobs') // => 'walmart.com'
 * extractDomain('https://boards.greenhouse.io/stripe') // => 'stripe.com'
 */
export function extractDomain(url: string): string {
  try {
    // First, check if this is a third-party job platform URL
    const platformCompany = extractCompanyFromPlatformUrl(url)
    if (platformCompany) {
      return platformCompany
    }

    // Otherwise, use standard domain extraction
    const urlObj = new URL(url)
    let hostname = urlObj.hostname.replace(/^www\./, '')

    // Common job board subdomains that should be stripped
    const jobSubdomains = [
      'careers',
      'jobs',
      'apply',
      'recruiting',
      'opportunities',
      'jointeam',
      'join',
      'work',
      'employment',
      'talent',
      'hire'
    ]

    const parts = hostname.split('.')

    // Only process if we have a subdomain (more than 2 parts for .com, 3 for .co.uk, etc.)
    if (parts.length > 2) {
      const subdomain = parts[0].toLowerCase()

      // Check if it's a job-related subdomain
      if (jobSubdomains.includes(subdomain)) {
        // Remove the subdomain to get root domain
        hostname = parts.slice(1).join('.')
      }
    }

    return hostname
  } catch {
    return ''
  }
}

/**
 * Get the company logo URL from Google Favicon API
 * @param url - The company's URL
 * @param size - The size of the favicon (default: 128)
 * @returns The logo URL or null if domain extraction fails
 */
export function getCompanyLogoUrl(url: string, size: number = 128): string | null {
  const domain = extractDomain(url)
  if (!domain) return null
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
}


/**
 * Logo Service - Centralized logo fetching with 100% FREE multi-API fallback chain
 *
 * Fallback hierarchy:
 * 1. DuckDuckGo Favicon (primary - reliable, no rate limits, FREE forever)
 * 2. Google Favicon (secondary - FREE forever)
 *
 * No API keys required!
 */

import { extractDomain } from '@/lib/utils'

export type LogoSource = 'duckduckgo' | 'google' | 'fallback'

export interface LogoResult {
  url: string
  source: LogoSource
  success: boolean
}

/**
 * Fetch logo from DuckDuckGo Favicon API
 * Free, no rate limits, reliable
 */
function fetchFromDuckDuckGo(domain: string): LogoResult {
  return {
    url: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    source: 'duckduckgo',
    success: true
  }
}

/**
 * Fetch logo from Google Favicon API
 * Unofficial API, use as last resort
 */
function fetchFromGoogle(domain: string, size: number = 128): LogoResult {
  return {
    url: `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`,
    source: 'google',
    success: true
  }
}

/**
 * Get company logo with automatic 100% FREE fallback chain
 * Tries multiple sources in order until one succeeds
 *
 * No API keys required!
 * DuckDuckGo → Google
 */
export async function getCompanyLogo(
  url: string,
  size: number = 128
): Promise<LogoResult> {
  const domain = extractDomain(url)

  if (!domain) {
    return {
      url: '',
      source: 'fallback',
      success: false
    }
  }

  // DuckDuckGo is the primary free source (reliable, no rate limits)
  const duckduckgoResult = fetchFromDuckDuckGo(domain)

  // Verify DuckDuckGo image loads (optional check)
  try {
    const response = await fetch(duckduckgoResult.url, { method: 'HEAD' })
    if (response.ok) {
      return duckduckgoResult
    }
  } catch {
    // If fetch fails, continue to Google
  }

  // Fall back to Google (also 100% free)
  return fetchFromGoogle(domain, size)
}

/**
 * Client-side version for use in React components
 * Returns URL directly since client can't await async operations easily
 */
export function getCompanyLogoUrl(url: string, size: number = 128): string | null {
  const domain = extractDomain(url)
  if (!domain) return null

  // For client-side, use DuckDuckGo as default (more reliable than Google)
  // Server-side rendering will use the full fallback chain
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

/**
 * Verify if a logo URL is accessible
 * Useful for admin verification interface
 */
export async function verifyLogoUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

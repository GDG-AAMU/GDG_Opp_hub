/**
 * Smart Scraper with Dynamic Block Detection
 * Tries scraping first, detects if blocked, then prompts for manual content
 */

import { scrapeUrl } from './web-scraper';

/**
 * Options for smart scraping
 */
export interface SmartScrapeOptions {
  url: string;
  manualContent?: string; // User-provided content as fallback
  timeout?: number;
}

/**
 * Result from smart scraping
 */
export interface SmartScrapeResult {
  success: boolean;
  content?: string;
  title?: string;
  method?: 'auto-scrape' | 'manual-paste' | 'failed';
  requiresManual?: boolean; // If true, ask user to paste content
  error?: string;
  metadata?: {
    url: string;
    isBlocked: boolean; // Changed from isRestricted to isBlocked
    scrapeMethod?: string;
    fallbackChain?: string[];
  };
}

/**
 * Checks if an error indicates the site is blocked/restricted
 */
function isBlockedError(error: string | undefined): boolean {
  if (!error) return false

  const lowerError = error.toLowerCase()
  
  // Check for access denied patterns
  const blockedPatterns = [
    'access denied',
    'access_denied',
    '401',
    '403',
    'forbidden',
    'unauthorized',
    'login required',
    'sign in required',
    'authentication required',
    'blocked',
    'bot detection',
    'captcha',
    'rate limited',
    '429',
  ]

  return blockedPatterns.some(pattern => lowerError.includes(pattern))
}

/**
 * Smart scraper with dynamic block detection
 *
 * Strategy:
 * 1. Try auto-scraping first (no hardcoded restrictions)
 * 2. If scraping succeeds: Return content
 * 3. If scraping fails with blocked error: Return requiresManual=true
 * 4. If user provided manual content: Use it regardless of scraping result
 * 5. If other error: Return requiresManual=true as fallback
 *
 * @param options - Scraping options
 * @returns Smart scrape result
 */
export async function smartScrape(
  options: SmartScrapeOptions
): Promise<SmartScrapeResult> {
  const { url, manualContent, timeout } = options;

  // If user provided manual content, we can use it directly
  // But still try scraping first to see if it works
  const hasManualContent = manualContent && manualContent.trim().length > 50

  // Try auto-scraping first (dynamic detection)
  try {
    const scrapeResult = await scrapeUrl(url, { timeout });

    if (scrapeResult.success) {
      // Scraping succeeded - use scraped content
      return {
        success: true,
        content: scrapeResult.content,
        title: scrapeResult.title,
        method: 'auto-scrape',
        metadata: {
          url,
          isBlocked: false,
          scrapeMethod: scrapeResult.method,
          fallbackChain: scrapeResult.fallbackChain,
        },
      };
    }

    // Scraping failed - check if it's a blocked error
    const isBlocked = isBlockedError(scrapeResult.error)

    // If user provided manual content, use it (even if scraping failed)
    if (hasManualContent) {
      return {
        success: true,
        content: manualContent!.trim(),
        method: 'manual-paste',
        metadata: {
          url,
          isBlocked: isBlocked,
        },
      };
    }

    // No manual content - require it if blocked, or if scraping failed
    return {
      success: false,
      requiresManual: true,
      error: isBlocked
        ? 'This site appears to be blocked or requires authentication. Please paste the job description manually.'
        : `Auto-scraping failed: ${scrapeResult.error}. Please paste the content manually.`,
      metadata: {
        url,
        isBlocked: isBlocked,
      },
    };
  } catch (error) {
    // Exception during scraping
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const isBlocked = isBlockedError(errorMessage)

    // If user provided manual content, use it
    if (hasManualContent) {
      return {
        success: true,
        content: manualContent!.trim(),
        method: 'manual-paste',
        metadata: {
          url,
          isBlocked: isBlocked,
        },
      };
    }

    // Otherwise, require manual paste
    return {
      success: false,
      requiresManual: true,
      error: isBlocked
        ? 'This site appears to be blocked or requires authentication. Please paste the job description manually.'
        : `Scraping error: ${errorMessage}. Please paste the content manually.`,
      metadata: {
        url,
        isBlocked: isBlocked,
      },
    };
  }
}

/**
 * Legacy function for backward compatibility
 * Now uses dynamic detection instead of hardcoded list
 */
export function isRestrictedSite(url: string): boolean {
  // This function is kept for backward compatibility
  // But it now returns false - we use dynamic detection instead
  // The actual detection happens in smartScrape()
  return false
}

/**
 * Get user-friendly message for blocked sites
 */
export function getRestrictedSiteMessage(url: string): string | null {
  // Generic message since we use dynamic detection
  return 'This site appears to be blocked or requires authentication. Please copy and paste the job description manually.';
}

/**
 * Example usage in your API route
 */
export async function exampleUsage(url: string, manualContent?: string) {
  const result = await smartScrape({ url, manualContent });

  if (result.requiresManual) {
    // Return to frontend: "Please paste the content manually"
    return {
      success: false,
      requiresManual: true,
      message: result.error,
      restrictedSiteMessage: getRestrictedSiteMessage(url),
    };
  }

  if (result.success) {
    // Success! Use the content
    return {
      success: true,
      content: result.content,
      method: result.method,
      title: result.title,
    };
  }

  // Other error
  return {
    success: false,
    error: result.error,
  };
}


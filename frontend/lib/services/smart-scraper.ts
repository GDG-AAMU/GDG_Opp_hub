/**
 * Smart Scraper with LinkedIn/Facebook Detection
 * Automatically detects restricted sites and provides fallback options
 */

import { scrapeUrl } from './web-scraper';

/**
 * Sites that require authentication or have aggressive bot detection
 */
const RESTRICTED_SITES = [
  'linkedin.com',
  'facebook.com',
  'fb.com',
  'twitter.com',
  'x.com',
  'instagram.com',
];

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
    isRestricted: boolean;
    scrapeMethod?: string;
    fallbackChain?: string[];
  };
}

/**
 * Checks if a URL is from a restricted site
 */
export function isRestrictedSite(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return RESTRICTED_SITES.some(site => hostname.includes(site));
  } catch {
    return false;
  }
}

/**
 * Smart scraper that handles restricted sites automatically
 *
 * Strategy:
 * 1. Check if URL is from restricted site (LinkedIn, Facebook, etc.)
 * 2. If restricted and no manual content: Return requiresManual=true
 * 3. If restricted with manual content: Use manual content
 * 4. If not restricted: Try auto-scraping
 * 5. If auto-scrape fails: Return requiresManual=true
 *
 * @param options - Scraping options
 * @returns Smart scrape result
 */
export async function smartScrape(
  options: SmartScrapeOptions
): Promise<SmartScrapeResult> {
  const { url, manualContent, timeout } = options;

  // Check if site is restricted
  const isRestricted = isRestrictedSite(url);

  // If restricted site
  if (isRestricted) {
    // If user provided manual content, use it
    if (manualContent && manualContent.trim().length > 50) {
      return {
        success: true,
        content: manualContent,
        method: 'manual-paste',
        metadata: {
          url,
          isRestricted: true,
        },
      };
    }

    // Otherwise, require manual paste
    return {
      success: false,
      requiresManual: true,
      error: 'This site requires manual content paste (LinkedIn, Facebook, etc.)',
      metadata: {
        url,
        isRestricted: true,
      },
    };
  }

  // Try auto-scraping for non-restricted sites
  try {
    const scrapeResult = await scrapeUrl(url, { timeout });

    if (scrapeResult.success) {
      return {
        success: true,
        content: scrapeResult.content,
        title: scrapeResult.title,
        method: 'auto-scrape',
        metadata: {
          url,
          isRestricted: false,
          scrapeMethod: scrapeResult.method,
          fallbackChain: scrapeResult.fallbackChain,
        },
      };
    }

    // Auto-scrape failed
    // If user provided manual content as fallback, use it
    if (manualContent && manualContent.trim().length > 50) {
      return {
        success: true,
        content: manualContent,
        method: 'manual-paste',
        metadata: {
          url,
          isRestricted: false,
        },
      };
    }

    // Otherwise, require manual paste
    return {
      success: false,
      requiresManual: true,
      error: `Auto-scraping failed: ${scrapeResult.error}. Please paste the content manually.`,
      metadata: {
        url,
        isRestricted: false,
      },
    };
  } catch (error) {
    // Exception during scraping
    // If user provided manual content, use it
    if (manualContent && manualContent.trim().length > 50) {
      return {
        success: true,
        content: manualContent,
        method: 'manual-paste',
        metadata: {
          url,
          isRestricted: false,
        },
      };
    }

    // Otherwise, return error
    return {
      success: false,
      requiresManual: true,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      metadata: {
        url,
        isRestricted: false,
      },
    };
  }
}

/**
 * Get user-friendly message for restricted sites
 */
export function getRestrictedSiteMessage(url: string): string | null {
  if (url.includes('linkedin.com')) {
    return 'LinkedIn requires login and blocks scrapers. Please copy and paste the job description.';
  }
  if (url.includes('facebook.com') || url.includes('fb.com')) {
    return 'Facebook requires login. Please copy and paste the job posting content.';
  }
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return 'Twitter/X has limited public access. Please copy and paste the post content.';
  }
  return null;
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

/**
 * Web Scraper Utility Functions
 * Provides URL validation, text cleaning, and site type detection
 */

/**
 * Custom error class for scraper-related errors
 */
export class ScraperError extends Error {
  constructor(
    message: string,
    public code:
      | 'INVALID_URL'
      | 'TIMEOUT'
      | 'ACCESS_DENIED'
      | 'RATE_LIMITED'
      | 'NETWORK_ERROR'
      | 'PARSING_ERROR'
      | 'UNKNOWN_ERROR',
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}

/**
 * Validates if a string is a valid URL
 * @param url - The URL string to validate
 * @returns true if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates and normalizes a URL
 * @param url - The URL to validate
 * @returns Normalized URL
 * @throws ScraperError if URL is invalid
 */
export function validateUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new ScraperError('URL is required and must be a string', 'INVALID_URL');
  }

  const trimmedUrl = url.trim();

  if (!isValidUrl(trimmedUrl)) {
    throw new ScraperError(`Invalid URL format: ${trimmedUrl}`, 'INVALID_URL');
  }

  return trimmedUrl;
}

/**
 * Cleans text by removing extra whitespace and normalizing line breaks
 * @param text - The text to clean
 * @returns Cleaned text
 */
export function cleanText(text: string): string {
  if (!text) return '';

  return text
    // Replace multiple whitespace characters with a single space
    .replace(/\s+/g, ' ')
    // Replace multiple line breaks with double line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Trim leading and trailing whitespace
    .trim();
}

/**
 * Detects if a site is likely to require JavaScript rendering
 * Based on common patterns in job posting sites
 * @param url - The URL to check
 * @returns true if likely JS-heavy, false otherwise
 */
export function isJavaScriptHeavySite(url: string): boolean {
  const jsHeavyDomains = [
    'greenhouse.io',
    'lever.co',
    'workday.com',
    'myworkdayjobs.com',
    'jobs.lever.co',
    'jobs.greenhouse.io',
    'applytojob.com',
    'recruiterflow.com',
    'ashbyhq.com',
    'breezy.hr',
    'smartrecruiters.com',
    'icims.com',
    'ultipro.com',
    'taleo.net',
    'successfactors.com',
  ];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return jsHeavyDomains.some(domain =>
      hostname.includes(domain.toLowerCase())
    );
  } catch {
    return false;
  }
}

/**
 * Creates an error from a fetch response
 * @param response - The fetch Response object
 * @param url - The URL that was fetched
 * @returns ScraperError with appropriate code
 */
export async function createErrorFromResponse(
  response: Response,
  url: string
): Promise<ScraperError> {
  const statusCode = response.status;

  switch (statusCode) {
    case 401:
    case 403:
      return new ScraperError(
        `Access denied for URL: ${url} (${statusCode})`,
        'ACCESS_DENIED',
        statusCode
      );
    case 429:
      return new ScraperError(
        `Rate limited for URL: ${url}`,
        'RATE_LIMITED',
        statusCode
      );
    case 404:
      return new ScraperError(
        `URL not found: ${url}`,
        'NETWORK_ERROR',
        statusCode
      );
    case 500:
    case 502:
    case 503:
    case 504:
      return new ScraperError(
        `Server error for URL: ${url} (${statusCode})`,
        'NETWORK_ERROR',
        statusCode
      );
    default:
      return new ScraperError(
        `HTTP error ${statusCode} for URL: ${url}`,
        'NETWORK_ERROR',
        statusCode
      );
  }
}

/**
 * Handles timeout errors
 * @param url - The URL that timed out
 * @param timeoutMs - The timeout duration in milliseconds
 * @returns ScraperError
 */
export function createTimeoutError(url: string, timeoutMs: number): ScraperError {
  return new ScraperError(
    `Request timed out after ${timeoutMs}ms for URL: ${url}`,
    'TIMEOUT'
  );
}

/**
 * Handles network errors
 * @param url - The URL that failed
 * @param error - The original error
 * @returns ScraperError
 */
export function createNetworkError(url: string, error: unknown): ScraperError {
  const message = error instanceof Error ? error.message : 'Unknown network error';
  return new ScraperError(
    `Network error for URL ${url}: ${message}`,
    'NETWORK_ERROR'
  );
}

/**
 * Default timeout for scraper requests (in milliseconds)
 */
export const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Default user agent for scraper requests
 */
export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';


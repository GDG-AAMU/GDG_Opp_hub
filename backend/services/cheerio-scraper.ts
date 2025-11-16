/**
 * Generic HTML Scraper using Cheerio
 * Handles static HTML content scraping
 */

import * as cheerio from 'cheerio';
import {
  validateUrl,
  cleanText,
  createErrorFromResponse,
  createTimeoutError,
  createNetworkError,
  DEFAULT_TIMEOUT,
  DEFAULT_USER_AGENT,
  ScraperError,
} from './scraper-utils';

/**
 * Scraper configuration options
 */
export interface CheerioScraperOptions {
  timeout?: number;
  userAgent?: string;
}

/**
 * Result from scraping
 */
export interface ScrapeResult {
  success: boolean;
  content: string;
  title?: string;
  error?: string;
}

/**
 * Common selectors for job posting content
 * Ordered by priority/specificity
 */
const CONTENT_SELECTORS = [
  // Semantic HTML5 elements
  'article',
  'main',
  '[role="main"]',

  // Common job posting class names
  '.job-description',
  '.job-content',
  '.job-details',
  '.posting-description',
  '.description',
  '.content',
  '#job-description',
  '#job-content',
  '#description',

  // Fallback to body if nothing else matches
  'body',
];

/**
 * Selectors for elements to remove (navigation, ads, etc.)
 */
const REMOVE_SELECTORS = [
  'nav',
  'header',
  'footer',
  'aside',
  '.navigation',
  '.navbar',
  '.header',
  '.footer',
  '.sidebar',
  '.ad',
  '.ads',
  '.advertisement',
  '.cookie-banner',
  '.cookie-notice',
  'script',
  'style',
  'noscript',
  'iframe',
  '.social-share',
  '.share-buttons',
  '[role="banner"]',
  '[role="navigation"]',
  '[role="complementary"]',
];

/**
 * Fetches HTML content from a URL with timeout support
 * @param url - The URL to fetch
 * @param options - Scraper options
 * @returns HTML content
 */
async function fetchHtml(
  url: string,
  options: CheerioScraperOptions = {}
): Promise<string> {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const userAgent = options.userAgent || DEFAULT_USER_AGENT;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw await createErrorFromResponse(response, url);
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw createTimeoutError(url, timeout);
    }

    // Handle ScraperError (from createErrorFromResponse)
    if (error instanceof ScraperError) {
      throw error;
    }

    // Handle other network errors
    throw createNetworkError(url, error);
  }
}

/**
 * Extracts and cleans content from HTML
 * @param html - The HTML content
 * @returns Cleaned text content
 */
function extractContent(html: string): { content: string; title?: string } {
  const $ = cheerio.load(html);

  // Extract title
  const title = $('title').text().trim() || $('h1').first().text().trim();

  // Remove unwanted elements
  REMOVE_SELECTORS.forEach(selector => {
    $(selector).remove();
  });

  // Try to find main content using selectors
  let content = '';
  for (const selector of CONTENT_SELECTORS) {
    const element = $(selector).first();
    if (element.length > 0) {
      content = element.text();
      // If we found substantial content, use it
      if (content.trim().length > 200) {
        break;
      }
    }
  }

  // If no content found, fallback to body
  if (!content || content.trim().length < 100) {
    content = $('body').text();
  }

  // Clean the content
  const cleanedContent = cleanText(content);

  return {
    content: cleanedContent,
    title: title || undefined,
  };
}

/**
 * Scrapes content from a URL using Cheerio
 * @param url - The URL to scrape
 * @param options - Scraper options
 * @returns Scrape result with content or error
 */
export async function scrapeWithCheerio(
  url: string,
  options: CheerioScraperOptions = {}
): Promise<ScrapeResult> {
  try {
    // Validate URL
    const validatedUrl = validateUrl(url);

    // Fetch HTML
    const html = await fetchHtml(validatedUrl, options);

    // Extract content
    const { content, title } = extractContent(html);

    // Verify we got meaningful content
    if (!content || content.length < 50) {
      throw new ScraperError(
        'Insufficient content extracted from page',
        'PARSING_ERROR'
      );
    }

    return {
      success: true,
      content,
      title,
    };
  } catch (error) {
    if (error instanceof ScraperError) {
      return {
        success: false,
        content: '',
        error: `${error.code}: ${error.message}`,
      };
    }

    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Checks if Cheerio scraping is likely to work for a given URL
 * This is a quick test that attempts to fetch and parse the page
 * @param url - The URL to test
 * @returns true if Cheerio can scrape the page, false otherwise
 */
export async function canScrapeWithCheerio(url: string): Promise<boolean> {
  try {
    const result = await scrapeWithCheerio(url, { timeout: 10000 });
    return result.success && result.content.length > 200;
  } catch {
    return false;
  }
}


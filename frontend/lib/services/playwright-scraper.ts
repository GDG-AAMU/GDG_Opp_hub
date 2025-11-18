/**
 * Playwright-based Scraper
 * Enhanced browser automation with better reliability and cross-browser support
 * Used as the final fallback in the scraping chain
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import {
  validateUrl,
  cleanText,
  createTimeoutError,
  ScraperError,
  DEFAULT_TIMEOUT,
  DEFAULT_USER_AGENT,
} from './scraper-utils';

/**
 * Playwright scraper configuration options
 */
export interface PlaywrightScraperOptions {
  timeout?: number;
  userAgent?: string;
  waitForSelector?: string;
  waitForTimeout?: number;
  blockResources?: boolean; // Block images, fonts, etc. for faster scraping
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
 * Global browser instance for reuse
 */
let browserInstance: Browser | null = null;
let browserContext: BrowserContext | null = null;

/**
 * Gets or creates a browser instance with context
 * Reuses existing instance to improve performance
 * @returns Browser context
 */
async function getBrowserContext(): Promise<BrowserContext> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    // Create a persistent context for better performance
    browserContext = await browserInstance.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: DEFAULT_USER_AGENT,
    });
  }

  if (!browserContext) {
    browserContext = await browserInstance.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: DEFAULT_USER_AGENT,
    });
  }

  return browserContext;
}

/**
 * Closes the browser instance and context
 * Should be called when done with all scraping operations
 */
export async function closeBrowser(): Promise<void> {
  if (browserContext) {
    await browserContext.close().catch(() => {});
    browserContext = null;
  }
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}

/**
 * Selectors to try for extracting main content
 */
const CONTENT_SELECTORS = [
  'article',
  'main',
  '[role="main"]',
  '.job-description',
  '.job-content',
  '.posting-description',
  '#job-description',
  'body',
];

/**
 * Scrapes content from a URL using Playwright
 * @param url - The URL to scrape
 * @param options - Scraper options
 * @returns Scrape result with content or error
 */
export async function scrapeWithPlaywright(
  url: string,
  options: PlaywrightScraperOptions = {}
): Promise<ScrapeResult> {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const userAgent = options.userAgent || DEFAULT_USER_AGENT;
  const waitForTimeout = options.waitForTimeout || 5000; // Wait 5s for JS to execute
  const blockResources = options.blockResources !== false; // Default true

  let page: Page | null = null;

  try {
    // Validate URL
    const validatedUrl = validateUrl(url);

    // Get browser context
    const context = await getBrowserContext();

    // Create new page
    page = await context.newPage();

    // Set user agent if different from default
    if (userAgent !== DEFAULT_USER_AGENT) {
      await page.setExtraHTTPHeaders({
        'User-Agent': userAgent,
      });
    }

    // Block unnecessary resources for faster scraping
    if (blockResources) {
      await page.route('**/*', (route: any) => {
        const resourceType = route.request().resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });
    }

    // Set timeout
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);

    // Navigate to URL
    try {
      await page.goto(validatedUrl, {
        waitUntil: 'domcontentloaded', // Faster than networkidle
        timeout,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw createTimeoutError(validatedUrl, timeout);
      }
      throw error;
    }

    // Wait for specific selector if provided
    if (options.waitForSelector) {
      try {
        await page.waitForSelector(options.waitForSelector, {
          timeout: waitForTimeout,
        });
      } catch {
        // Continue even if selector not found
      }
    } else {
      // Wait for a reasonable time for dynamic content to load
      await page.waitForTimeout(waitForTimeout);
    }

    // Extract title
    const title = await page.title();

    // Try to extract content from main content areas
    let content = '';
    for (const selector of CONTENT_SELECTORS) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await (element as any).textContent();
          if (text && text.trim().length > 200) {
            content = text;
            break;
          }
        }
      } catch {
        // Continue to next selector
      }
    }

    // If no content found, fallback to body
    if (!content || content.trim().length < 100) {
      const bodyElement = await page.$('body');
      if (bodyElement) {
        content = (await bodyElement.textContent()) || '';
      }
    }

    // Clean the content
    const cleanedContent = cleanText(content);

    // Verify we got meaningful content
    if (!cleanedContent || cleanedContent.length < 50) {
      throw new ScraperError(
        'Insufficient content extracted from page',
        'PARSING_ERROR'
      );
    }

    return {
      success: true,
      content: cleanedContent,
      title: title || undefined,
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
  } finally {
    // Close the page
    if (page) {
      await page.close().catch(() => {
        // Ignore errors when closing page
      });
    }
  }
}

/**
 * Scrapes multiple URLs in parallel using Playwright
 * Useful for batch processing
 * @param urls - Array of URLs to scrape
 * @param options - Scraper options
 * @param maxConcurrent - Maximum number of concurrent scrapes
 * @returns Array of scrape results
 */
export async function scrapeMultipleWithPlaywright(
  urls: string[],
  options: PlaywrightScraperOptions = {},
  maxConcurrent: number = 3
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(url => scrapeWithPlaywright(url, options))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Takes a screenshot of a page (useful for debugging)
 * @param url - The URL to screenshot
 * @param outputPath - Path to save the screenshot
 * @param options - Scraper options
 */
export async function takeScreenshot(
  url: string,
  outputPath: string,
  options: PlaywrightScraperOptions = {}
): Promise<void> {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  let page: Page | null = null;

  try {
    const validatedUrl = validateUrl(url);
    const context = await getBrowserContext();
    page = await context.newPage();

    page.setDefaultNavigationTimeout(timeout);

    await page.goto(validatedUrl, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    await page.screenshot({
      path: outputPath,
      fullPage: true,
    });
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

/**
 * Gets page HTML source (useful for debugging)
 * @param url - The URL to get HTML from
 * @param options - Scraper options
 * @returns HTML content
 */
export async function getPageHTML(
  url: string,
  options: PlaywrightScraperOptions = {}
): Promise<string> {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  let page: Page | null = null;

  try {
    const validatedUrl = validateUrl(url);
    const context = await getBrowserContext();
    page = await context.newPage();

    page.setDefaultNavigationTimeout(timeout);

    await page.goto(validatedUrl, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    return await page.content();
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}


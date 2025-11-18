/**
 * JavaScript-Heavy Site Scraper using Puppeteer
 * Handles sites that require JavaScript rendering
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import {
  validateUrl,
  cleanText,
  createTimeoutError,
  ScraperError,
  DEFAULT_TIMEOUT,
  DEFAULT_USER_AGENT,
} from './scraper-utils';

/**
 * Puppeteer scraper configuration options
 */
export interface PuppeteerScraperOptions {
  timeout?: number;
  userAgent?: string;
  waitForSelector?: string;
  waitForTimeout?: number;
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

/**
 * Gets or creates a browser instance
 * Reuses existing instance to improve performance
 * @returns Browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });
  }
  return browserInstance;
}

/**
 * Closes the browser instance
 * Should be called when done with all scraping operations
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
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
 * Scrapes content from a URL using Puppeteer
 * @param url - The URL to scrape
 * @param options - Scraper options
 * @returns Scrape result with content or error
 */
export async function scrapeWithPuppeteer(
  url: string,
  options: PuppeteerScraperOptions = {}
): Promise<ScrapeResult> {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const userAgent = options.userAgent || DEFAULT_USER_AGENT;
  const waitForTimeout = options.waitForTimeout || 5000; // Wait 5s for JS to execute

  let page: Page | null = null;

  try {
    // Validate URL
    const validatedUrl = validateUrl(url);

    // Get browser instance
    const browser = await getBrowser();

    // Create new page
    page = await browser.newPage();

    // Set user agent and viewport
    await page.setExtraHTTPHeaders({
      'User-Agent': userAgent,
    });

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set timeout
    page.setDefaultNavigationTimeout(timeout);
    page.setDefaultTimeout(timeout);

    // Navigate to URL
    try {
      await page.goto(validatedUrl, {
        waitUntil: 'networkidle2', // Wait until network is idle
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
      await new Promise(resolve => setTimeout(resolve, waitForTimeout));
    }

    // Extract title
    const title = await page.title();

    // Try to extract content from main content areas
    let content = '';
    for (const selector of CONTENT_SELECTORS) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await page.evaluate((el: any) => el?.textContent || '', element);
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
      content = await page.evaluate(() => document.body.textContent || '');
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
 * Scrapes multiple URLs in parallel using Puppeteer
 * Useful for batch processing
 * @param urls - Array of URLs to scrape
 * @param options - Scraper options
 * @param maxConcurrent - Maximum number of concurrent scrapes
 * @returns Array of scrape results
 */
export async function scrapeMultipleWithPuppeteer(
  urls: string[],
  options: PuppeteerScraperOptions = {},
  maxConcurrent: number = 3
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(url => scrapeWithPuppeteer(url, options))
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
  options: PuppeteerScraperOptions = {}
): Promise<void> {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  let page: Page | null = null;

  try {
    const validatedUrl = validateUrl(url);
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultNavigationTimeout(timeout);

    await page.goto(validatedUrl, {
      waitUntil: 'networkidle2',
      timeout,
    });

    await page.screenshot({
      path: outputPath as `${string}.png`,
      fullPage: true,
    });
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}


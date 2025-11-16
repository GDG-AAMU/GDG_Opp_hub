/**
 * Web Scraper Service
 * Main scraping service with triple fallback logic
 * Strategy: Cheerio (fastest) → Puppeteer → Playwright (most reliable)
 */

import { scrapeWithCheerio } from './cheerio-scraper';
import { scrapeWithPuppeteer, closeBrowser as closePuppeteerBrowser } from './puppeteer-scraper';
import { scrapeWithPlaywright, closeBrowser as closePlaywrightBrowser } from './playwright-scraper';
import { isJavaScriptHeavySite, validateUrl, ScraperError } from './scraper-utils';

/**
 * Scraper configuration options
 */
export interface ScraperOptions {
  timeout?: number;
  userAgent?: string;
  forcePuppeteer?: boolean; // Force use of Puppeteer
  forcePlaywright?: boolean; // Force use of Playwright
  forceCheerio?: boolean; // Force use of Cheerio
  disablePlaywrightFallback?: boolean; // Disable Playwright as final fallback
}

/**
 * Result from scraping
 */
export interface ScraperResult {
  success: boolean;
  content: string;
  title?: string;
  method?: 'cheerio' | 'puppeteer' | 'playwright'; // Which method was used
  error?: string;
  fallbackUsed?: boolean; // Whether fallback was triggered
  fallbackChain?: string[]; // Chain of methods tried
}

/**
 * Scrapes content from a URL with triple fallback chain
 *
 * Strategy:
 * 1. Validate URL
 * 2. Try Cheerio (fastest, for static HTML)
 * 3. If Cheerio fails, try Puppeteer (for JS-heavy sites)
 * 4. If Puppeteer fails, try Playwright (most reliable, final fallback)
 * 5. Return best result with metadata
 *
 * @param url - The URL to scrape
 * @param options - Scraper options
 * @returns Scrape result with content and metadata
 */
export async function scrapeUrl(
  url: string,
  options: ScraperOptions = {}
): Promise<ScraperResult> {
  const fallbackChain: string[] = [];

  try {
    // Validate URL
    const validatedUrl = validateUrl(url);

    // Force specific scraper if requested
    if (options.forceCheerio) {
      fallbackChain.push('cheerio');
      const result = await scrapeWithCheerio(validatedUrl, {
        timeout: options.timeout,
        userAgent: options.userAgent,
      });

      return {
        ...result,
        method: 'cheerio',
        fallbackUsed: false,
        fallbackChain,
      };
    }

    if (options.forcePuppeteer) {
      fallbackChain.push('puppeteer');
      const result = await scrapeWithPuppeteer(validatedUrl, {
        timeout: options.timeout,
        userAgent: options.userAgent,
      });

      return {
        ...result,
        method: 'puppeteer',
        fallbackUsed: false,
        fallbackChain,
      };
    }

    if (options.forcePlaywright) {
      fallbackChain.push('playwright');
      const result = await scrapeWithPlaywright(validatedUrl, {
        timeout: options.timeout,
        userAgent: options.userAgent,
      });

      return {
        ...result,
        method: 'playwright',
        fallbackUsed: false,
        fallbackChain,
      };
    }

    // Triple fallback chain: Cheerio → Puppeteer → Playwright
    const isJsHeavy = isJavaScriptHeavySite(validatedUrl);

    // Step 1: Try Cheerio first (unless known to be JS-heavy)
    if (!isJsHeavy) {
      fallbackChain.push('cheerio');
      const cheerioResult = await scrapeWithCheerio(validatedUrl, {
        timeout: options.timeout,
        userAgent: options.userAgent,
      });

      // Success with sufficient content (at least 50 chars is meaningful)
      if (cheerioResult.success && cheerioResult.content.length >= 50) {
        return {
          ...cheerioResult,
          method: 'cheerio',
          fallbackUsed: false,
          fallbackChain,
        };
      }
    }

    // Step 2: Try Puppeteer
    fallbackChain.push('puppeteer');
    const puppeteerResult = await scrapeWithPuppeteer(validatedUrl, {
      timeout: options.timeout,
      userAgent: options.userAgent,
    });

    // Success with sufficient content (at least 50 chars is meaningful)
    if (puppeteerResult.success && puppeteerResult.content.length >= 50) {
      return {
        ...puppeteerResult,
        method: 'puppeteer',
        fallbackUsed: fallbackChain.length > 1,
        fallbackChain,
      };
    }

    // Step 3: Try Playwright (final fallback)
    if (!options.disablePlaywrightFallback) {
      fallbackChain.push('playwright');
      const playwrightResult = await scrapeWithPlaywright(validatedUrl, {
        timeout: options.timeout,
        userAgent: options.userAgent,
        blockResources: true, // Block resources for faster scraping
      });

      return {
        ...playwrightResult,
        method: playwrightResult.success ? 'playwright' : undefined,
        fallbackUsed: true,
        fallbackChain,
      };
    }

    // All methods failed
    return {
      success: false,
      content: '',
      error: 'All scraping methods failed',
      method: undefined,
      fallbackUsed: true,
      fallbackChain,
    };
  } catch (error) {
    if (error instanceof ScraperError) {
      return {
        success: false,
        content: '',
        error: `${error.code}: ${error.message}`,
        method: undefined,
        fallbackUsed: fallbackChain.length > 1,
        fallbackChain,
      };
    }

    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      method: undefined,
      fallbackUsed: fallbackChain.length > 1,
      fallbackChain,
    };
  }
}

/**
 * Scrapes multiple URLs in parallel
 * Uses the same fallback logic for each URL
 *
 * @param urls - Array of URLs to scrape
 * @param options - Scraper options
 * @param maxConcurrent - Maximum number of concurrent scrapes
 * @returns Array of scrape results
 */
export async function scrapeMultipleUrls(
  urls: string[],
  options: ScraperOptions = {},
  maxConcurrent: number = 3
): Promise<ScraperResult[]> {
  const results: ScraperResult[] = [];

  // Process URLs in batches to avoid overwhelming the system
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(url => scrapeUrl(url, options))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Cleans up scraper resources
 * Should be called when done with all scraping operations
 */
export async function cleanup(): Promise<void> {
  await Promise.all([
    closePuppeteerBrowser(),
    closePlaywrightBrowser(),
  ]);
}

/**
 * Export utility functions for convenience
 */
export { validateUrl, isJavaScriptHeavySite, ScraperError } from './scraper-utils';

/**
 * Export individual scrapers for advanced use cases
 */
export { scrapeWithCheerio } from './cheerio-scraper';
export { scrapeWithPuppeteer, closeBrowser as closePuppeteerBrowser } from './puppeteer-scraper';
export { scrapeWithPlaywright, closeBrowser as closePlaywrightBrowser } from './playwright-scraper';


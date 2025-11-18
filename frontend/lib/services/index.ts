/**
 * Web Scraper Service - Main Export File
 *
 * This file exports all the main functions, types, and utilities
 * from the web scraper service for easy importing.
 */

// Main scraper functions
export {
  scrapeUrl,
  scrapeMultipleUrls,
  cleanup,
  scrapeWithCheerio,
  scrapeWithPuppeteer,
  scrapeWithPlaywright,
  closePuppeteerBrowser,
  closePlaywrightBrowser,
} from './web-scraper';

// Types
export type {
  ScraperOptions,
  ScraperResult,
} from './web-scraper';

export type {
  CheerioScraperOptions,
  ScrapeResult,
} from './cheerio-scraper';

export type {
  PuppeteerScraperOptions,
} from './puppeteer-scraper';

export type {
  PlaywrightScraperOptions,
} from './playwright-scraper';

// Utilities
export {
  validateUrl,
  isValidUrl,
  cleanText,
  isJavaScriptHeavySite,
  ScraperError,
  createTimeoutError,
  createNetworkError,
  DEFAULT_TIMEOUT,
  DEFAULT_USER_AGENT,
} from './scraper-utils';

// Smart scraper with LinkedIn/Facebook handling
export {
  smartScrape,
  isRestrictedSite,
  getRestrictedSiteMessage,
} from './smart-scraper';

export type {
  SmartScrapeOptions,
  SmartScrapeResult,
} from './smart-scraper';

// Re-export for convenience
export { canScrapeWithCheerio } from './cheerio-scraper';
export { scrapeMultipleWithPuppeteer, takeScreenshot as takeScreenshotWithPuppeteer } from './puppeteer-scraper';
export { scrapeMultipleWithPlaywright, takeScreenshot as takeScreenshotWithPlaywright, getPageHTML } from './playwright-scraper';


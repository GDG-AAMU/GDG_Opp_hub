/**
 * API Integration Example
 * Demonstrates how to use the web scraper in Next.js API routes
 * and integrate with Gemini AI for job posting parsing
 */

import { scrapeUrl, cleanup, ScraperError } from './web-scraper';

/**
 * Example API Route Handler for submitting job URLs
 * This would go in app/api/opportunities/submit/route.ts
 */

// Type definitions for the API
interface SubmitJobRequest {
  url: string;
  companyName?: string;
  opportunityType: 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship';
}

interface SubmitJobResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    companyName: string;
    jobTitle: string;
    deadline?: string;
    scrapingMethod: 'cheerio' | 'puppeteer' | 'playwright';
  };
  error?: string;
}

/**
 * Example: POST /api/opportunities/submit
 *
 * This is a pseudo-code example showing how to integrate
 * the web scraper with Gemini AI parsing
 */
export async function handleSubmitJob(
  request: SubmitJobRequest
): Promise<SubmitJobResponse> {
  try {
    const { url, companyName, opportunityType } = request;

    // Step 1: Scrape the webpage content
    console.log(`Scraping URL: ${url}`);
    const scrapeResult = await scrapeUrl(url, {
      timeout: 45000, // 45 seconds for job posting pages
    });

    if (!scrapeResult.success) {
      return {
        success: false,
        error: `Failed to scrape URL: ${scrapeResult.error}`,
      };
    }

    console.log(`Successfully scraped using ${scrapeResult.method}`);
    console.log(`Content length: ${scrapeResult.content.length} characters`);

    // Step 2: Parse with Gemini AI
    // This is pseudo-code - you would import your actual Gemini service
    /*
    const geminiResult = await parseJobPostingWithGemini({
      content: scrapeResult.content,
      url: url,
      opportunityType: opportunityType,
      providedCompanyName: companyName,
    });

    if (!geminiResult.success) {
      return {
        success: false,
        error: 'Failed to parse job posting with AI',
      };
    }
    */

    // Step 3: Save to database (pseudo-code)
    /*
    const opportunity = await saveOpportunityToDatabase({
      url: url,
      companyName: geminiResult.companyName || companyName,
      jobTitle: geminiResult.jobTitle,
      opportunityType: opportunityType,
      roleType: geminiResult.roleType,
      relevantMajors: geminiResult.relevantMajors,
      deadline: geminiResult.deadline,
      requirements: geminiResult.requirements,
      location: geminiResult.location,
      description: geminiResult.description,
      submittedBy: userId,
      status: 'active',
      aiParsedData: geminiResult,
    });
    */

    // Step 4: Return success
    return {
      success: true,
      data: {
        id: 'example-id',
        url: url,
        companyName: companyName || 'Parsed Company',
        jobTitle: scrapeResult.title || 'Job Title',
        deadline: undefined,
        scrapingMethod: scrapeResult.method!,
      },
    };
  } catch (error) {
    console.error('Error in handleSubmitJob:', error);

    if (error instanceof ScraperError) {
      return {
        success: false,
        error: `Scraping error: ${error.code} - ${error.message}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  } finally {
    // Clean up browser instances (optional, depending on your deployment)
    // You might want to skip this if handling multiple requests
    // await cleanup();
  }
}

/**
 * Example: Batch scraping for admin import
 * POST /api/admin/import-jobs
 */
export async function handleBatchImport(urls: string[]): Promise<{
  success: boolean;
  results: Array<{ url: string; success: boolean; error?: string }>;
}> {
  const { scrapeMultipleUrls } = await import('./web-scraper');

  try {
    console.log(`Starting batch import of ${urls.length} URLs`);

    // Scrape all URLs (max 3 concurrent)
    const scrapeResults = await scrapeMultipleUrls(urls, { timeout: 45000 }, 3);

    const results = scrapeResults.map((result, index) => ({
      url: urls[index],
      success: result.success,
      error: result.error,
    }));

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error('Error in batch import:', error);
    return {
      success: false,
      results: urls.map(url => ({
        url,
        success: false,
        error: 'Batch import failed',
      })),
    };
  } finally {
    // Clean up after batch processing
    await cleanup();
  }
}

/**
 * Example: Health check endpoint to test scraper
 * GET /api/scraper/health
 */
export async function handleHealthCheck(): Promise<{
  success: boolean;
  cheerioAvailable: boolean;
  puppeteerAvailable: boolean;
  message: string;
}> {
  try {
    // Test with a simple, reliable URL
    const testUrl = 'https://example.com';

    const result = await scrapeUrl(testUrl, {
      timeout: 10000,
      forceCheerio: true, // Test Cheerio first
    });

    const cheerioWorks = result.success;

    // You could also test Puppeteer here
    // const puppeteerResult = await scrapeUrl(testUrl, { forcePuppeteer: true });

    return {
      success: true,
      cheerioAvailable: cheerioWorks,
      puppeteerAvailable: true, // Assume true if installed
      message: 'Web scraper is healthy',
    };
  } catch (error) {
    return {
      success: false,
      cheerioAvailable: false,
      puppeteerAvailable: false,
      message: error instanceof Error ? error.message : 'Health check failed',
    };
  }
}

/**
 * Example: Middleware to validate and sanitize URLs
 */
export function validateJobUrl(url: string): {
  valid: boolean;
  sanitizedUrl?: string;
  error?: string;
} {
  const { validateUrl, isValidUrl } = require('./scraper-utils');

  try {
    const sanitized = validateUrl(url);

    // Additional checks
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return {
        valid: false,
        error: 'Local URLs are not allowed',
      };
    }

    return {
      valid: true,
      sanitizedUrl: sanitized,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid URL',
    };
  }
}

/**
 * Example: Error handling middleware
 */
export function handleScraperError(error: unknown): {
  statusCode: number;
  message: string;
  code?: string;
} {
  if (error instanceof ScraperError) {
    switch (error.code) {
      case 'INVALID_URL':
        return {
          statusCode: 400,
          message: error.message,
          code: error.code,
        };
      case 'TIMEOUT':
        return {
          statusCode: 408,
          message: 'Request timeout while scraping URL',
          code: error.code,
        };
      case 'ACCESS_DENIED':
        return {
          statusCode: 403,
          message: 'Access denied to the requested URL',
          code: error.code,
        };
      case 'RATE_LIMITED':
        return {
          statusCode: 429,
          message: 'Rate limited by target server',
          code: error.code,
        };
      default:
        return {
          statusCode: 500,
          message: error.message,
          code: error.code,
        };
    }
  }

  return {
    statusCode: 500,
    message: 'Internal server error',
  };
}

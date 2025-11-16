# Web Scraper Service

A comprehensive web scraping service for extracting content from job posting URLs. This service provides a **triple fallback chain** for maximum reliability:

**Cheerio** (fastest) → **Puppeteer** (JS support) → **Playwright** (most reliable)

## Features

- **Triple Fallback Chain**: Tries Cheerio → Puppeteer → Playwright for maximum success rate
- **Automatic Strategy Selection**: Intelligently chooses the best scraper based on the URL
- **Maximum Reliability**: Falls back through 3 different scrapers until one succeeds
- **Error Handling**: Comprehensive error handling for various failure scenarios
- **URL Validation**: Validates URLs before scraping
- **Text Cleaning**: Removes extra whitespace and normalizes content
- **Multiple URL Support**: Can scrape multiple URLs in parallel
- **Timeout Support**: Configurable timeouts for all operations
- **Resource Management**: Proper cleanup of all browser instances
- **Fallback Chain Tracking**: See which methods were tried and which succeeded

## Files

- `web-scraper.ts` - Main scraper service with triple fallback logic
- `cheerio-scraper.ts` - Generic HTML scraper using Cheerio (fast)
- `puppeteer-scraper.ts` - JavaScript-heavy site scraper using Puppeteer
- `playwright-scraper.ts` - Most reliable scraper using Playwright (final fallback)
- `scraper-utils.ts` - Utility functions and error handling
- `smart-scraper.ts` - Smart scraper with LinkedIn/Facebook detection
- `api-integration.example.ts` - Usage examples

## Installation

Dependencies are already installed in the project:

```bash
npm install cheerio puppeteer playwright
npm install -D @types/cheerio @types/puppeteer
npx playwright install chromium
```

## Basic Usage

```typescript
import { scrapeUrl } from '@/backend/services';

// Scrape a URL (automatic fallback chain)
const result = await scrapeUrl('https://example.com/job-posting');

if (result.success) {
  console.log('Title:', result.title);
  console.log('Content:', result.content);
  console.log('Method used:', result.method); // 'cheerio', 'puppeteer', or 'playwright'
  console.log('Fallback chain:', result.fallbackChain); // ['cheerio', 'puppeteer', ...]
} else {
  console.error('Error:', result.error);
}
```

## Advanced Usage

### Custom Timeout

```typescript
import { scrapeUrl } from '@/backend/services/web-scraper';

const result = await scrapeUrl('https://example.com/job', {
  timeout: 60000, // 60 seconds
});
```

### Force Puppeteer

```typescript
import { scrapeUrl } from '@/backend/services/web-scraper';

const result = await scrapeUrl('https://example.com/job', {
  forcePuppeteer: true, // Always use Puppeteer
});
```

### Force Specific Scraper

```typescript
import { scrapeUrl } from '@/backend/services';

// Force Cheerio only
const cheerioResult = await scrapeUrl('https://example.com/job', {
  forceCheerio: true,
});

// Force Puppeteer only
const puppeteerResult = await scrapeUrl('https://example.com/job', {
  forcePuppeteer: true,
});

// Force Playwright only
const playwrightResult = await scrapeUrl('https://example.com/job', {
  forcePlaywright: true,
});

// Disable Playwright fallback (only try Cheerio → Puppeteer)
const noPlaywrightResult = await scrapeUrl('https://example.com/job', {
  disablePlaywrightFallback: true,
});
```

### Scrape Multiple URLs

```typescript
import { scrapeMultipleUrls } from '@/backend/services/web-scraper';

const urls = [
  'https://example.com/job1',
  'https://example.com/job2',
  'https://example.com/job3',
];

const results = await scrapeMultipleUrls(
  urls,
  { timeout: 30000 },
  2 // Max 2 concurrent scrapes
);

results.forEach((result, index) => {
  console.log(`URL ${index + 1}:`, result.success);
});
```

### Cleanup Resources

```typescript
import { cleanup } from '@/backend/services/web-scraper';

// When done with all scraping
await cleanup();
```

## API Reference

### `scrapeUrl(url, options?)`

Main function to scrape a single URL.

**Parameters:**
- `url` (string): The URL to scrape
- `options` (optional):
  - `timeout` (number): Timeout in milliseconds (default: 30000)
  - `userAgent` (string): Custom user agent
  - `forceCheerio` (boolean): Force use of Cheerio only
  - `forcePuppeteer` (boolean): Force use of Puppeteer only
  - `forcePlaywright` (boolean): Force use of Playwright only
  - `disablePlaywrightFallback` (boolean): Disable Playwright as final fallback

**Returns:** Promise<ScraperResult>
- `success` (boolean): Whether scraping succeeded
- `content` (string): Extracted text content
- `title` (string, optional): Page title
- `method` ('cheerio' | 'puppeteer' | 'playwright', optional): Method that succeeded
- `error` (string, optional): Error message if failed
- `fallbackUsed` (boolean, optional): Whether fallback was triggered
- `fallbackChain` (string[], optional): Chain of methods tried (e.g., ['cheerio', 'puppeteer'])

### `scrapeMultipleUrls(urls, options?, maxConcurrent?)`

Scrape multiple URLs in parallel.

**Parameters:**
- `urls` (string[]): Array of URLs to scrape
- `options` (optional): Same as `scrapeUrl`
- `maxConcurrent` (number): Max concurrent scrapes (default: 3)

**Returns:** Promise<ScraperResult[]>

### `cleanup()`

Clean up browser instances and resources.

**Returns:** Promise<void>

## Error Handling

The scraper provides comprehensive error handling:

```typescript
import { scrapeUrl, ScraperError } from '@/backend/services/web-scraper';

try {
  const result = await scrapeUrl('https://example.com/job');

  if (!result.success) {
    // Handle error
    console.error('Scraping failed:', result.error);
    // Error format: "ERROR_CODE: Error message"
  }
} catch (error) {
  if (error instanceof ScraperError) {
    console.error('Scraper error:', error.code, error.message);
  }
}
```

### Error Codes

- `INVALID_URL` - Invalid URL format
- `TIMEOUT` - Request timed out
- `ACCESS_DENIED` - 401/403 HTTP status
- `RATE_LIMITED` - 429 HTTP status (rate limiting)
- `NETWORK_ERROR` - Network or HTTP error
- `PARSING_ERROR` - Failed to parse content
- `UNKNOWN_ERROR` - Unknown error

## Scraping Strategy

The scraper uses a **triple fallback chain** for maximum reliability:

1. **Validate URL**: Check if URL is valid
2. **Detect Site Type**: Check if URL is known to be JavaScript-heavy
3. **Try Cheerio** (fastest):
   - Skip if site is known to be JS-heavy
   - If successful with sufficient content (>200 chars), return
   - Otherwise, continue to Puppeteer
4. **Try Puppeteer** (JS support):
   - If successful with sufficient content, return
   - Otherwise, continue to Playwright
5. **Try Playwright** (final fallback, most reliable):
   - Last resort for difficult sites
   - Most compatible and reliable
   - Return result (success or failure)
6. **Return Result**: Return cleaned content with metadata including fallback chain

### JavaScript-Heavy Sites

The scraper automatically detects common job posting platforms that require JavaScript:
- Greenhouse.io
- Lever.co
- Workday
- Ashby HQ
- SmartRecruiters
- And more...

## Integration with Gemini AI

Example integration with Gemini for job parsing:

```typescript
import { scrapeUrl, cleanup } from '@/backend/services/web-scraper';
import { parseJobPosting } from '@/lib/ai/gemini';

async function submitJobUrl(url: string) {
  try {
    // Step 1: Scrape content
    const scrapeResult = await scrapeUrl(url);

    if (!scrapeResult.success) {
      throw new Error(`Failed to scrape: ${scrapeResult.error}`);
    }

    // Step 2: Parse with Gemini
    const parsedData = await parseJobPosting(scrapeResult.content);

    // Step 3: Save to database
    await saveOpportunity({
      url,
      title: scrapeResult.title,
      ...parsedData,
    });

    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  } finally {
    // Cleanup if this is the last operation
    await cleanup();
  }
}
```

## Performance Considerations

1. **Speed hierarchy**: Cheerio (fastest) > Puppeteer > Playwright (slowest but most reliable)
2. **Resource usage**: Cheerio uses minimal resources, Puppeteer and Playwright use more memory/CPU
3. **Browser reuse**: Both Puppeteer and Playwright reuse browser instances for better performance
4. **Fallback overhead**: Each fallback adds time, but ensures maximum success rate
5. **Concurrent limits**: Limit concurrent scrapes (default: 3) to avoid overwhelming the system
6. **Cleanup**: Always call `cleanup()` when done to close both Puppeteer and Playwright browsers
7. **Resource blocking**: Playwright blocks images/fonts by default for faster scraping

## Supported Sites

The scraper works with most job posting sites, including:

### Static HTML Sites (Cheerio)
- Career pages with standard HTML
- Company job boards
- Job aggregators

### JavaScript-Heavy Sites (Puppeteer)
- Greenhouse
- Lever
- Workday
- Ashby
- SmartRecruiters
- iCIMS
- Taleo
- And more...

## Troubleshooting

### Issue: Scraping returns empty content

**Solution**: The site might be JS-heavy. Try forcing Puppeteer:
```typescript
const result = await scrapeUrl(url, { forcePuppeteer: true });
```

### Issue: Timeout errors

**Solution**: Increase timeout:
```typescript
const result = await scrapeUrl(url, { timeout: 60000 });
```

### Issue: Access denied (403)

**Solution**: Some sites block scrapers. Try:
1. Use a different user agent
2. Add delay between requests
3. Use Puppeteer instead of Cheerio

### Issue: Rate limiting (429)

**Solution**:
1. Reduce concurrent scrapes
2. Add delays between requests
3. Implement retry logic with exponential backoff

## Best Practices

1. **Always cleanup**: Call `cleanup()` when done with scraping
2. **Handle errors**: Always check `result.success` and handle errors
3. **Use timeouts**: Set reasonable timeouts based on site complexity
4. **Limit concurrency**: Don't scrape too many URLs at once
5. **Respect robots.txt**: Check if scraping is allowed
6. **Cache results**: Cache scraped content to avoid re-scraping
7. **Monitor performance**: Track which method is used and adjust strategy

## License

Part of the GDG Opportunities Platform project.


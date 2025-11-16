import { scrapeUrl } from '@/backend/services';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url') || 'https://example.com';
  const force = searchParams.get('force') as 'cheerio' | 'puppeteer' | 'playwright' | null;

  try {
    const options: any = {};

    if (force === 'cheerio') options.forceCheerio = true;
    if (force === 'puppeteer') options.forcePuppeteer = true;
    if (force === 'playwright') options.forcePlaywright = true;

    const startTime = Date.now();
    const result = await scrapeUrl(url, options);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: result.success,
      method: result.method,
      fallbackChain: result.fallbackChain,
      fallbackUsed: result.fallbackUsed,
      contentLength: result.content.length,
      title: result.title,
      contentPreview: result.content.substring(0, 300),
      duration: `${duration}ms`,
      error: result.error,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

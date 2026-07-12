import { NextResponse } from 'next/server';
import { scrapeArticle } from '../_shared/scrape';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only http(s) URLs allowed' }, { status: 400 });
    }

    const scraped = await scrapeArticle(parsed.toString());
    if (!scraped.ok) {
      return NextResponse.json(
        { error: scraped.error || 'Could not extract article text', url: scraped.url },
        { status: 422 }
      );
    }

    return NextResponse.json({
      url: scraped.url,
      title: scraped.title,
      content: scraped.text,
      site: new URL(scraped.url).hostname.replace(/^www\./, ''),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}

import * as cheerio from 'cheerio';

const UA =
  'Mozilla/5.0 (compatible; LLMagnetBot/1.0; newsroom research; +https://github.com/ritvik-sethi/LLMagnet)';

/** Fetch a public article URL and extract readable text (best-effort). */
export async function scrapeArticle(url: string): Promise<{
  url: string;
  title: string;
  text: string;
  ok: boolean;
  error?: string;
}> {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { url, title: '', text: '', ok: false, error: 'Invalid protocol' };
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      return { url, title: '', text: '', ok: false, error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    $('script, style, nav, footer, iframe, noscript, svg, form').remove();

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').first().text() ||
      $('h1').first().text() ||
      '';

    const article =
      $('article').text() ||
      $('[role="main"]').text() ||
      $('main').text() ||
      $('.article-body, .story-body, .post-content, .entry-content').text() ||
      $('body').text();

    const text = article
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000);

    if (text.length < 120) {
      return { url, title: title.trim(), text, ok: false, error: 'Too little readable text' };
    }

    return { url, title: title.trim(), text, ok: true };
  } catch (e) {
    return {
      url,
      title: '',
      text: '',
      ok: false,
      error: e instanceof Error ? e.message : 'Scrape failed',
    };
  }
}

export async function scrapeMany(
  urls: string[],
  limit = 4
): Promise<Awaited<ReturnType<typeof scrapeArticle>>[]> {
  const unique = [...new Set(urls)].slice(0, limit);
  return Promise.all(unique.map(scrapeArticle));
}

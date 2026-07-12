/**
 * Live web search for newsroom signals.
 * Prefers Serper → Google CSE → DuckDuckGo HTML fallback.
 */

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
  site: string;
  source: 'google' | 'x' | 'news' | 'web';
  publishedAt?: string;
  engine: 'Google' | 'X' | 'News' | 'Web';
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function toHit(partial: {
  title: string;
  url: string;
  snippet: string;
  source: SearchHit['source'];
  publishedAt?: string;
}): SearchHit {
  const site = hostnameOf(partial.url);
  const engine: SearchHit['engine'] =
    partial.source === 'x'
      ? 'X'
      : partial.source === 'news'
        ? 'News'
        : partial.source === 'google'
          ? 'Google'
          : 'Web';
  return { ...partial, site, engine };
}

async function searchSerper(
  query: string,
  type: 'search' | 'news' = 'search'
): Promise<{ hits: SearchHit[]; peopleAlsoAsk: { question: string; snippet: string; title: string; link: string }[] }> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return { hits: [], peopleAlsoAsk: [] };

  const endpoint = type === 'news' ? 'https://google.serper.dev/news' : 'https://google.serper.dev/search';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, num: 10, gl: 'in', hl: 'en' }),
  });
  if (!res.ok) return { hits: [], peopleAlsoAsk: [] };
  const data = await res.json();
  const rows = type === 'news' ? data.news ?? [] : data.organic ?? [];
  const hits = rows.map((r: { title?: string; link?: string; snippet?: string; date?: string }) =>
    toHit({
      title: r.title ?? '',
      url: r.link ?? '',
      snippet: r.snippet ?? '',
      source: type === 'news' ? 'news' : 'google',
      publishedAt: r.date,
    })
  );
  const peopleAlsoAsk = Array.isArray(data.peopleAlsoAsk)
    ? data.peopleAlsoAsk.map(
        (p: { question?: string; snippet?: string; title?: string; link?: string }) => ({
          question: p.question ?? '',
          snippet: p.snippet ?? '',
          title: p.title ?? '',
          link: p.link ?? '',
        })
      )
    : [];
  return { hits, peopleAlsoAsk };
}

async function searchGoogleCse(query: string): Promise<SearchHit[]> {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return [];

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', key);
  url.searchParams.set('cx', cx);
  url.searchParams.set('q', query);
  url.searchParams.set('num', '10');

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map((r: { title?: string; link?: string; snippet?: string }) =>
    toHit({
      title: r.title ?? '',
      url: r.link ?? '',
      snippet: r.snippet ?? '',
      source: 'google',
    })
  );
}

async function searchDuckDuckGo(query: string): Promise<SearchHit[]> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LLMagnetBot/1.0; +https://github.com/ritvik-sethi/LLMagnet)',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const hits: SearchHit[] = [];
    const re =
      /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|td)>)?/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && hits.length < 10) {
      const rawUrl = m[1];
      const title = m[2].replace(/<[^>]+>/g, '').trim();
      const snippet = (m[3] ?? '').replace(/<[^>]+>/g, '').trim();
      let url = rawUrl;
      const uddg = /uddg=([^&]+)/.exec(rawUrl);
      if (uddg) url = decodeURIComponent(uddg[1]);
      if (title && url) hits.push(toHit({ title, url, snippet, source: 'web' }));
    }
    return hits;
  } catch {
    return [];
  }
}

async function searchWeb(query: string): Promise<{
  hits: SearchHit[];
  peopleAlsoAsk: { question: string; snippet: string; title: string; link: string }[];
}> {
  const serper = await searchSerper(query, 'search');
  if (serper.hits.length) return serper;
  const cse = await searchGoogleCse(query);
  if (cse.length) return { hits: cse, peopleAlsoAsk: [] };
  return { hits: await searchDuckDuckGo(query), peopleAlsoAsk: [] };
}

async function searchNews(query: string): Promise<SearchHit[]> {
  const news = await searchSerper(query, 'news');
  if (news.hits.length) return news.hits;
  return (await searchWeb(`${query} news`)).hits;
}

/** Public: search Google + news for one claim / query. */
export async function searchTopic(query: string): Promise<{
  google: SearchHit[];
  news: SearchHit[];
  peopleAlsoAsk: { question: string; snippet: string; title: string; link: string }[];
  providerNote: string;
}> {
  const [web, news] = await Promise.all([searchWeb(query), searchNews(query)]);
  const hasSerper = Boolean(process.env.SERPER_API_KEY);
  const hasCse = Boolean(process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID);
  return {
    google: web.hits,
    news,
    peopleAlsoAsk: web.peopleAlsoAsk,
    providerNote: hasSerper ? 'Serper → Google' : hasCse ? 'Google CSE' : 'DuckDuckGo',
  };
}

async function searchX(query: string): Promise<SearchHit[]> {
  const bearer = process.env.TWITTER_BEARER_TOKEN;
  if (bearer) {
    try {
      const url = new URL('https://api.twitter.com/2/tweets/search/recent');
      url.searchParams.set('query', `${query} -is:retweet lang:en`);
      url.searchParams.set('max_results', '10');
      url.searchParams.set('tweet.fields', 'created_at,author_id,text');
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${bearer}` },
      });
      if (res.ok) {
        const data = await res.json();
        return (data.data ?? []).map((t: { id: string; text: string; created_at?: string }) =>
          toHit({
            title: t.text.slice(0, 80) + (t.text.length > 80 ? '…' : ''),
            url: `https://x.com/i/web/status/${t.id}`,
            snippet: t.text,
            source: 'x',
            publishedAt: t.created_at,
          })
        );
      }
    } catch {
      /* fall through */
    }
  }

  const hits = await searchWeb(`site:x.com OR site:twitter.com ${query}`);
  return hits.hits.map((h) => toHit({ ...h, source: 'x' }));
}

/** Public: recent X / Twitter discussion for a topic. */
export async function searchXPosts(query: string): Promise<SearchHit[]> {
  return searchX(query);
}

/** Public: Reddit threads for a topic (via web search site:reddit.com). */
export async function searchRedditPosts(query: string): Promise<SearchHit[]> {
  const hits = await searchWeb(`site:reddit.com ${query}`);
  return hits.hits
    .filter((h) => /reddit\.com/i.test(h.url))
    .map((h) => toHit({ ...h, source: 'web', title: h.title || 'Reddit thread' }));
}

export async function gatherLiveSignals(topic: string): Promise<{
  google: SearchHit[];
  news: SearchHit[];
  x: SearchHit[];
  similar: SearchHit[];
  peopleAlsoAsk: { question: string; snippet: string; title: string; link: string }[];
  providerNote: string;
  references: SearchHit[];
}> {
  const q = topic.trim() || 'Indian startups';
  const [googleRes, news, x, similarRes] = await Promise.all([
    searchWeb(q),
    searchNews(q),
    searchX(q),
    searchWeb(`${q} similar articles OR coverage OR analysis`),
  ]);

  const google = googleRes.hits;
  const similar = similarRes.hits;

  const hasSerper = Boolean(process.env.SERPER_API_KEY);
  const hasCse = Boolean(process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID);
  const hasX = Boolean(process.env.TWITTER_BEARER_TOKEN);

  const providerNote = [
    hasSerper ? 'Serper → Google Search' : hasCse ? 'Google CSE' : 'DuckDuckGo → web',
    hasX ? 'X API' : 'X via Google/web site:x.com',
  ].join(' · ');

  const seen = new Set<string>();
  const references: SearchHit[] = [];
  for (const h of [...google, ...news, ...similar, ...x]) {
    if (!h.url || seen.has(h.url)) continue;
    seen.add(h.url);
    references.push(h);
  }

  return {
    google,
    news,
    x,
    similar,
    peopleAlsoAsk: googleRes.peopleAlsoAsk,
    providerNote,
    references,
  };
}

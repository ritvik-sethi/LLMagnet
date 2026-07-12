import { NextResponse } from 'next/server';
import { searchTopic, type SearchHit } from '../_shared/webSearch';
import { scrapeMany } from '../_shared/scrape';
import { extractArticleClaims, runCouncil } from '../_shared/council';
import { classifyEditorialContent } from '../_shared/articleGate';

export const maxDuration = 120;

function formatHits(hits: SearchHit[], limit = 4): string {
  return hits
    .slice(0, limit)
    .map((h, i) => `${i + 1}. [${h.engine} · ${h.site}] ${h.title}\n${h.url}\n${h.snippet}`)
    .join('\n');
}

export async function POST(request: Request) {
  try {
    const { heading, content } = await request.json();
    const article = (content as string) || '';
    const title = (heading as string) || '';

    const gate = await classifyEditorialContent(title, article);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.message, code: gate.code, kind: gate.kind },
        { status: 400 }
      );
    }
    // 1) Extract factual claims from the article
    let claims = await extractArticleClaims(title, article);
    if (claims.length < 5) {
      // Pad with topic searches so we still research ≥5 angles
      const fallbackQs = [
        `${title} funding`,
        `${title} competitors India`,
        `${title} market share`,
        `${title} latest news`,
        `${title} investors`,
      ];
      while (claims.length < 5) {
        const q = fallbackQs[claims.length] || `${title} news ${claims.length}`;
        claims.push({
          claim: `Context around: ${title} (${claims.length + 1})`,
          searchQuery: q,
        });
      }
    }

    // 2) Search the web for EACH claim (Google + news)
    const claimResearch = await Promise.all(
      claims.slice(0, 7).map(async (c) => {
        const results = await searchTopic(c.searchQuery);
        return {
          claim: c.claim,
          searchQuery: c.searchQuery,
          google: results.google,
          news: results.news,
          providerNote: results.providerNote,
        };
      })
    );

    // 3) Scrape top URLs from claim searches for deeper facts
    const scrapeUrls = claimResearch
      .flatMap((c) => [...c.news, ...c.google].map((h) => h.url))
      .filter(
        (u) =>
          u.startsWith('http') &&
          !u.includes('x.com') &&
          !u.includes('twitter.com') &&
          !u.includes('facebook.com')
      );
    const scraped = await scrapeMany([...new Set(scrapeUrls)], 4);
    const okScrapes = scraped.filter((s) => s.ok);

    const claimBlocks = claimResearch
      .map((c, i) => {
        const g = formatHits(c.google);
        const n = formatHits(c.news);
        return `--- CLAIM ${i + 1} ---\nCLAIM: ${c.claim}\nSEARCH: ${c.searchQuery}\nGOOGLE:\n${g || '(no hits)'}\nNEWS:\n${n || '(no hits)'}`;
      })
      .join('\n\n');

    const scrapedBlock = okScrapes.length
      ? okScrapes
          .map((s, i) => {
            const site = (() => {
              try {
                return new URL(s.url).hostname.replace(/^www\./, '');
              } catch {
                return '';
              }
            })();
            return `--- FULL ARTICLE ${i + 1}: ${s.title}\nSITE: ${site}\nURL: ${s.url}\n${s.text.slice(0, 3000)}`;
          })
          .join('\n\n')
      : '(No full pages scraped — use claim search snippets only.)';

    // 4) Full Indian business-desk polish (facts + judgment woven in, no labelled opinions)
    const result = await runCouncil({
      tool: 'rewrite',
      content: `HEADLINE: ${title}

ORIGINAL ARTICLE:
${article}

=== PER-CLAIM WEB RESEARCH (verify & densify EACH of these — minimum 5) ===
${claimBlocks}

=== SCRAPED FULL ARTICLES (prefer for deeper facts) ===
${scrapedBlock}

REQUIREMENTS REMINDER:
- You are a senior Indian business newsroom editor. Edit substantially — densify, reframe, add market context.
- Densify at least 5 claims from the research blocks above.
- Be opinionated and carefully speculative in the prose itself; never label anything as "opinion".
- Never invent facts not in the draft or the research. Use [NEED: …] when unknown.
- Return a full rewritten article plus an "additions" list of what you added.`,
    });

    const references = claimResearch.flatMap((c) => [...c.google, ...c.news]);
    const seen = new Set<string>();
    const uniqueRefs = references.filter((h) => {
      if (!h.url || seen.has(h.url)) return false;
      seen.add(h.url);
      return true;
    });

    return NextResponse.json({
      ...result,
      claimResearch: claimResearch.map((c) => ({
        claim: c.claim,
        searchQuery: c.searchQuery,
        hitCount: c.google.length + c.news.length,
        topSources: [...c.news, ...c.google].slice(0, 3).map((h) => ({
          title: h.title,
          url: h.url,
          site: h.site,
          engine: h.engine,
        })),
      })),
      webSources: {
        providerNote: claimResearch[0]?.providerNote || 'web search',
        references: uniqueRefs.slice(0, 20),
        scraped: scraped.map((s) => ({
          url: s.url,
          title: s.title,
          ok: s.ok,
          error: s.error,
          site: (() => {
            try {
              return new URL(s.url).hostname.replace(/^www\./, '');
            } catch {
              return '';
            }
          })(),
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in rewrite-for-llm:', error);
    return NextResponse.json({ error: 'Failed to rewrite content' }, { status: 500 });
  }
}

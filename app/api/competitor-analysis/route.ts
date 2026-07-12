import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import https from 'https';
import { searchTopic, hostnameOf, type SearchHit } from '../_shared/webSearch';
import { scrapeMany } from '../_shared/scrape';
import { runCouncil } from '../_shared/council';
import { classifyEditorialContent } from '../_shared/articleGate';

export const maxDuration = 120;

const JUNK =
  /facebook\.com|fb\.com|instagram\.com|pinterest\.com|tiktok\.com|youtube\.com|x\.com|twitter\.com/i;

/** Map common Indian outlet names in copy → hostname to exclude. */
const OUTLET_HINTS: { re: RegExp; host: string }[] = [
  { re: /\binc42\b/i, host: 'inc42.com' },
  { re: /\beconomic\s*times\b|\bet\s+prime\b/i, host: 'economictimes.indiatimes.com' },
  { re: /\bmint\b|livemint/i, host: 'livemint.com' },
  { re: /\byourstory\b/i, host: 'yourstory.com' },
  { re: /\bentrackr\b/i, host: 'entrackr.com' },
  { re: /\btechcrunch\b/i, host: 'techcrunch.com' },
  { re: /\bthe\s+hindu\b/i, host: 'thehindu.com' },
  { re: /\bbusiness\s+standard\b/i, host: 'business-standard.com' },
  { re: /\bmoneycontrol\b/i, host: 'moneycontrol.com' },
];

function sameSite(url: string, blocked: Set<string>): boolean {
  const host = hostnameOf(url).toLowerCase();
  if (!host) return false;
  for (const b of blocked) {
    if (!b) continue;
    if (host === b || host.endsWith(`.${b}`)) return true;
  }
  return false;
}

function blockedHostsFromSource(sourceUrl: string, content: string): Set<string> {
  const blocked = new Set<string>();
  const fromUrl = hostnameOf(sourceUrl || '').toLowerCase();
  if (fromUrl) blocked.add(fromUrl);

  // If draft clearly belongs to a named outlet (byline / "Inc42 asked"), exclude that site too
  for (const { re, host } of OUTLET_HINTS) {
    if (re.test(content) && (fromUrl.includes(host.split('.')[0]) || fromUrl === host || !fromUrl)) {
      // Only auto-hint when sourceUrl matches that outlet, OR when sourceUrl empty but name appears often
      const mentions = (content.match(re) || []).length;
      if (fromUrl && (fromUrl === host || fromUrl.includes(host.split('.')[0]))) {
        blocked.add(host);
      } else if (!fromUrl && mentions >= 2) {
        blocked.add(host);
      }
    }
  }
  return blocked;
}

interface ReverseEngineerResult {
  googleSearches: string[];
  llmSearches: string[];
  sourceOutletDomain: string | null;
}

async function reverseEngineerSearches(
  title: string,
  content: string
): Promise<ReverseEngineerResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    const t = title || 'this topic';
    return {
      googleSearches: [
        `${t} news India`,
        `${t} analysis`,
        `${t} vs competitors`,
        `${t} funding`,
        `${t} market`,
      ],
      llmSearches: [
        `What happened with ${t}?`,
        `Why does ${t} matter for Indian startups?`,
        `${t} risks and outlook`,
        `Who competes with companies in ${t}?`,
      ],
      sourceOutletDomain: null,
    };
  }

  const client = new OpenAI({
    apiKey: key,
    httpAgent: new https.Agent({ rejectUnauthorized: false }),
  });

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.25,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `You are a newsroom researcher reverse-engineering an article into search queries to FIND COMPETING coverage (other outlets).

HEADLINE: ${title}
ARTICLE (excerpt):
${(content || '').slice(0, 3500)}

Return ONLY JSON:
{
  "sourceOutletDomain": "hostname of the outlet this piece likely came from, e.g. inc42.com — or null if unknown",
  "googleSearches": ["5–6 Google queries a reporter would run to find OTHER outlets covering the same story/companies/angle"],
  "llmSearches": ["4–5 questions a user would ask ChatGPT/Gemini about this topic — the kind of answers rivals might already own"]
}

Rules:
- googleSearches should surface rival journalism (news, analysis, explainers), not social posts.
- Include company names, India context, and alternate angles (funding, regulation, failure parallels, competitors).
- llmSearches should be natural questions, under 14 words each.
- Do NOT invent company names not in the article.`,
      },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}') as Partial<ReverseEngineerResult>;
  return {
    googleSearches: (raw.googleSearches || []).filter(Boolean).slice(0, 6),
    llmSearches: (raw.llmSearches || []).filter(Boolean).slice(0, 5),
    sourceOutletDomain: raw.sourceOutletDomain || null,
  };
}

export async function POST(request: Request) {
  try {
    const { heading, content, competitorUrls, sourceUrl } = await request.json();
    const title = ((heading as string) || '').trim();
    const article = (content as string) || '';

    const gate = await classifyEditorialContent(title, article);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.message, code: gate.code, kind: gate.kind },
        { status: 400 }
      );
    }

    const blocked = blockedHostsFromSource((sourceUrl as string) || '', article);

    // 1) Reverse-engineer → Google + LLM-style searches
    const reverse = await reverseEngineerSearches(title, article);
    if (reverse.sourceOutletDomain) {
      blocked.add(hostnameOf(`https://${reverse.sourceOutletDomain}`) || reverse.sourceOutletDomain);
    }

    const allQueries = [...reverse.googleSearches, ...reverse.llmSearches];
    if (allQueries.length === 0 && title) {
      allQueries.push(title, `${title} India news`);
    }

    // 2) Run every search; collect rival candidate URLs (not our source site)
    const searchRuns = await Promise.all(
      allQueries.map(async (q) => {
        const res = await searchTopic(q);
        return { query: q, google: res.google, news: res.news, providerNote: res.providerNote };
      })
    );

    const providerNote = searchRuns[0]?.providerNote || 'web search';
    const candidateHits: SearchHit[] = [];
    const seenUrl = new Set<string>();

    for (const run of searchRuns) {
      for (const h of [...run.news, ...run.google]) {
        if (!h.url?.startsWith('http') || JUNK.test(h.url)) continue;
        if (sameSite(h.url, blocked)) continue;
        if (seenUrl.has(h.url)) continue;
        seenUrl.add(h.url);
        candidateHits.push(h);
      }
    }

    // Manual URLs: keep only if not same site
    let manual: string[] = Array.isArray(competitorUrls)
      ? competitorUrls.filter((u: unknown) => typeof u === 'string')
      : [];
    manual = manual.filter((u) => u.startsWith('http') && !sameSite(u, blocked) && !JUNK.test(u));

    const autoUrls = candidateHits.map((h) => h.url);
    const urls = [...new Set([...manual, ...autoUrls])].slice(0, 10);

    // 3) Read a good amount of rival articles
    const scraped = await scrapeMany(urls, 8);
    const okScrapes = scraped.filter((s) => s.ok && !sameSite(s.url, blocked));

    const competitorBlock = okScrapes.length
      ? okScrapes
          .map(
            (s, i) =>
              `--- RIVAL ${i + 1}: ${s.title}\nSITE: ${hostnameOf(s.url)}\nURL: ${s.url}\n${s.text.slice(0, 4500)}`
          )
          .join('\n\n')
      : '(No rival pages could be scraped after excluding the source outlet — still infer gaps a strong competing desk would cover.)';

    const queryBlock = [
      'GOOGLE-STYLE SEARCHES:',
      ...reverse.googleSearches.map((q, i) => `${i + 1}. ${q}`),
      '',
      'LLM-STYLE SEARCHES (questions users ask AI):',
      ...reverse.llmSearches.map((q, i) => `${i + 1}. ${q}`),
    ].join('\n');

    // 4) Gap analysis — how OUR article holds up vs what rivals covered
    const result = await runCouncil({
      tool: 'competitor',
      content: `OUR HEADLINE: ${title}

OUR ARTICLE:
${article}

EXCLUDED SOURCE SITE(S) (do not treat as rivals): ${[...blocked].join(', ') || 'none'}

SEARCHES WE RAN TO FIND RIVALS:
${queryBlock}

SCRAPED RIVAL ARTICLES (other outlets only):
${competitorBlock}

TASK: Dig deep. Compare OUR piece against rivals on facts, angles, numbers, quotes, timelines, and LLM-answer readiness. Flag what rivals have that we still lack — and what we uniquely own.`,
    });

    return NextResponse.json({
      ...result,
      excludedSites: [...blocked],
      searchPlan: {
        googleSearches: reverse.googleSearches,
        llmSearches: reverse.llmSearches,
      },
      discoveryHits: candidateHits.slice(0, 16).map((h) => ({
        title: h.title,
        url: h.url,
        site: h.site,
        engine: h.engine,
        snippet: h.snippet,
      })),
      scraped: scraped
        .filter((s) => !sameSite(s.url, blocked))
        .map((s) => ({
          url: s.url,
          title: s.title,
          ok: s.ok,
          error: s.error,
          site: hostnameOf(s.url),
          excerpt: s.text.slice(0, 280),
        })),
      providerNote,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in competitor scrape:', error);
    return NextResponse.json({ error: 'Failed to analyze competitors' }, { status: 500 });
  }
}

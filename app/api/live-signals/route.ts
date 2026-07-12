import { NextResponse } from 'next/server';
import {
  searchTopic,
  searchXPosts,
  searchRedditPosts,
  hostnameOf,
  type SearchHit,
} from '../_shared/webSearch';
import { runCouncil } from '../_shared/council';
import OpenAI from 'openai';
import https from 'https';
import { classifyEditorialContent } from '../_shared/articleGate';

export const maxDuration = 120;

function isJunkUrl(url: string) {
  const u = url.toLowerCase();
  return (
    u.includes('facebook.com') ||
    u.includes('fb.com') ||
    u.includes('instagram.com') ||
    u.includes('pinterest.com') ||
    u.includes('tiktok.com')
  );
}

function cleanHits(hits: SearchHit[]) {
  return hits.filter((h) => h.url && !isJunkUrl(h.url));
}

/** Prefer diverse outlets — skip duplicates of the same host after the first. */
function diversify(hits: SearchHit[], limit = 6): SearchHit[] {
  const seenHost = new Set<string>();
  const out: SearchHit[] = [];
  for (const h of hits) {
    const host = (h.site || hostnameOf(h.url)).toLowerCase();
    if (host && seenHost.has(host) && out.length >= 2) continue;
    if (host) seenHost.add(host);
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}

function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    httpAgent: new https.Agent({ rejectUnauthorized: false }),
  });
}

/** Rephrase the headline into search-friendly queries for social + news sentiment. */
async function rephraseTitleForSearch(
  title: string,
  content: string
): Promise<{ rephrased: string; altPhrases: string[] }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      rephrased: title,
      altPhrases: [title.replace(/\?$/, ''), `${title} India`],
    };
  }

  const completion = await getClient().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `Rephrase this news headline into short search phrases people would type on Google, X, or Reddit to find discussion of the SAME story.

HEADLINE: ${title}
EXCERPT: ${(content || '').slice(0, 400)}

Return ONLY JSON:
{
  "rephrased": "one clear 6–12 word search phrase (entities + topic, not a full question)",
  "altPhrases": ["2 alternate short phrases"]
}`,
      },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}') as {
    rephrased?: string;
    altPhrases?: string[];
  };
  return {
    rephrased: (raw.rephrased || title).trim(),
    altPhrases: (raw.altPhrases || []).filter(Boolean).slice(0, 2),
  };
}

async function suggestUserQuestions(title: string, content: string): Promise<string[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    const t = title || 'this topic';
    return [
      `What is ${t}?`,
      `How does ${t} work in India?`,
      `${t} vs competitors`,
      `Is ${t} available in Delhi?`,
      `${t} funding / investors`,
    ];
  }

  const completion = await getClient().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `You help a newsroom see what readers type into Google.
Given this headline and article excerpt, return 5 short questions a curious Indian reader or investor would Google — the kind that show up as "People also ask".

HEADLINE: ${title}
EXCERPT: ${(content || '').slice(0, 600)}

Return ONLY JSON: { "questions": ["...", "...", "...", "...", "..."] }
Questions must be natural Google queries (not editorial). Keep each under 12 words.`,
      },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}') as {
    questions?: string[];
  };
  return (raw.questions || []).filter(Boolean).slice(0, 5);
}

export type SocialKind = 'x' | 'reddit' | 'news';

export interface SocialItem {
  tag: 'SOCIAL';
  kind: SocialKind;
  title: string;
  url: string;
  site: string;
  summary: string;
}

/** Write a one-line editor-facing summary for each social/news hit. */
async function summarizeSocialItems(
  items: { kind: SocialKind; title: string; url: string; site: string; snippet: string }[]
): Promise<SocialItem[]> {
  if (items.length === 0) return [];

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return items.map((it) => ({
      tag: 'SOCIAL' as const,
      kind: it.kind,
      title: it.title,
      url: it.url,
      site: it.site,
      summary: it.snippet.slice(0, 180) || it.title,
    }));
  }

  const completion = await getClient().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: `You help an Indian business newsroom scan reader sentiment and fresh coverage.
For each item, write ONE short summary (max 28 words) of what the tweet / Reddit post / news article is saying — useful to an editor, neutral tone.

ITEMS:
${items
  .map(
    (it, i) =>
      `${i + 1}. kind=${it.kind} | site=${it.site} | title=${it.title} | text=${it.snippet.slice(0, 280)}`
  )
  .join('\n')}

Return ONLY JSON: { "summaries": ["...", "..."] } — same order and length as ITEMS.`,
      },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}') as {
    summaries?: string[];
  };
  const summaries = raw.summaries || [];

  return items.map((it, i) => ({
    tag: 'SOCIAL' as const,
    kind: it.kind,
    title: it.title,
    url: it.url,
    site: it.site,
    summary: (summaries[i] || it.snippet || it.title).trim(),
  }));
}

export async function POST(request: Request) {
  try {
    const { heading, content, sourceUrl } = await request.json();
    const title = ((heading as string) || '').trim() || '';
    const article = ((content as string) || '').trim();

    const gate = await classifyEditorialContent(title, article);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.message, code: gate.code, kind: gate.kind },
        { status: 400 }
      );
    }

    const safeTitle = title || 'Indian startups';
    const sourceHost = sourceUrl ? hostnameOf(sourceUrl).toLowerCase() : '';

    // 1) Rephrase title + user questions in parallel
    const [phrase, userQuestions] = await Promise.all([
      rephraseTitleForSearch(safeTitle, content ?? ''),
      suggestUserQuestions(safeTitle, content ?? ''),
    ]);

    const socialQuery = phrase.rephrased || safeTitle;

    // 2) Fresh X + Reddit + news on rephrased title; questions in parallel
    const [xHits, redditHits, newsSearch, questionSearches] = await Promise.all([
      searchXPosts(socialQuery),
      searchRedditPosts(socialQuery),
      searchTopic(socialQuery),
      Promise.all(
        userQuestions.map(async (q) => {
          const res = await searchTopic(q);
          return {
            question: q,
            peopleAlsoAsk: res.peopleAlsoAsk.filter((p) => p.question),
            results: cleanHits([...res.google, ...res.news])
              .filter((h) => !sourceHost || hostnameOf(h.url) !== sourceHost)
              .slice(0, 5),
          };
        })
      ),
    ]);

    const newsFresh = diversify(
      cleanHits(newsSearch.news)
        .concat(cleanHits(newsSearch.google))
        .filter((h) => {
          const host = hostnameOf(h.url).toLowerCase();
          if (sourceHost && (host === sourceHost || host.endsWith(`.${sourceHost}`))) return false;
          if (/x\.com|twitter\.com|reddit\.com/i.test(h.url)) return false;
          return true;
        }),
      5
    );

    const xFresh = cleanHits(xHits).slice(0, 5);
    const redditFresh = cleanHits(redditHits).slice(0, 5);

    const socialRaw = [
      ...xFresh.map((h) => ({
        kind: 'x' as const,
        title: h.title,
        url: h.url,
        site: h.site || 'x.com',
        snippet: h.snippet,
      })),
      ...redditFresh.map((h) => ({
        kind: 'reddit' as const,
        title: h.title,
        url: h.url,
        site: h.site || 'reddit.com',
        snippet: h.snippet,
      })),
      ...newsFresh.map((h) => ({
        kind: 'news' as const,
        title: h.title,
        url: h.url,
        site: h.site || hostnameOf(h.url),
        snippet: h.snippet,
      })),
    ];

    const social = await summarizeSocialItems(socialRaw);

    const paaSeen = new Set<string>();
    const peopleAlsoAsk = [
      ...newsSearch.peopleAlsoAsk,
      ...questionSearches.flatMap((qs) => qs.peopleAlsoAsk),
    ].filter((p) => {
      if (!p.question || paaSeen.has(p.question)) return false;
      paaSeen.add(p.question);
      return true;
    });

    const seen = new Set<string>();
    const references: SearchHit[] = [];
    for (const h of [...xFresh, ...redditFresh, ...newsFresh, ...questionSearches.flatMap((q) => q.results)]) {
      if (!h.url || seen.has(h.url)) continue;
      seen.add(h.url);
      references.push(h);
    }

    const socialBlock = social
      .map(
        (s, i) =>
          `${i + 1}. [SOCIAL · ${s.kind}] ${s.title}\n   ${s.url}\n   Summary: ${s.summary}`
      )
      .join('\n');

    const questionBlock = questionSearches
      .map((qs, i) => {
        const links = qs.results
          .map((h, j) => `  ${j + 1}. ${h.site} — ${h.title}\n     ${h.url}`)
          .join('\n');
        return `USER QUESTION ${i + 1}: "${qs.question}"\nWhat Google shows:\n${links || '  (no links)'}`;
      })
      .join('\n\n');

    const liveBlock = [
      `REPHRASED TITLE USED FOR SOCIAL/NEWS SEARCH: ${socialQuery}`,
      `ALT PHRASES: ${phrase.altPhrases.join(' | ') || '(none)'}`,
      '=== SOCIAL (X + Reddit + fresh news — with summaries) ===',
      socialBlock || '(no social/news hits)',
      '=== QUESTIONS PEOPLE ASK (and result links) ===',
      questionBlock,
      '=== PEOPLE ALSO ASK ===',
      peopleAlsoAsk
        .slice(0, 8)
        .map((p, i) => `${i + 1}. ${p.question}\n   ${p.snippet}\n   ${p.link || ''}`)
        .join('\n') || '(none)',
    ].join('\n\n');

    const result = await runCouncil({
      tool: 'live-check',
      content: `HEADLINE: ${safeTitle}\n\nARTICLE:\n${content ?? ''}\n\nLIVE RESEARCH (provider: ${newsSearch.providerNote}):\n${liveBlock}`,
    });

    return NextResponse.json({
      ...result,
      searchQueries: {
        title: safeTitle,
        rephrased: socialQuery,
        altPhrases: phrase.altPhrases,
        userQuestions,
      },
      signals: {
        social,
        userQuestions: questionSearches,
        peopleAlsoAsk,
        references,
        providerNote: [
          newsSearch.providerNote,
          process.env.TWITTER_BEARER_TOKEN ? 'X API' : 'X via web',
          'Reddit via web',
        ].join(' · '),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in live-signals:', error);
    return NextResponse.json({ error: 'Failed to gather live signals' }, { status: 500 });
  }
}

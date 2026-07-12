import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';
import { classifyEditorialContent } from '../_shared/articleGate';

interface LiveSocial {
  kind?: string;
  title?: string;
  url?: string;
  site?: string;
  summary?: string;
}

interface LiveCheckPayload {
  liveVerdict?: string;
  rephrased?: string;
  userQuestions?: string[];
  social?: LiveSocial[];
  peopleAlsoAsk?: { question?: string; snippet?: string }[];
}

function formatLiveCheck(live: LiveCheckPayload | null | undefined): string {
  if (!live) {
    return '(No Live check snapshot yet — advise from the draft only, and note that running Live check first would sharpen advice.)';
  }

  const socialBlock = (live.social || [])
    .slice(0, 12)
    .map(
      (s, i) =>
        `${i + 1}. [${(s.kind || 'item').toUpperCase()}] ${s.title || '(untitled)'}\n   ${s.url || ''}\n   Sentiment/summary: ${s.summary || '(none)'}`
    )
    .join('\n');

  const questions = (live.userQuestions || []).map((q, i) => `${i + 1}. ${q}`).join('\n');
  const paa = (live.peopleAlsoAsk || [])
    .slice(0, 8)
    .map((p, i) => `${i + 1}. ${p.question || ''}${p.snippet ? ` — ${p.snippet}` : ''}`)
    .join('\n');

  return [
    `LIVE DESK VERDICT: ${live.liveVerdict || '(none)'}`,
    `REPHRASED SEARCH USED: ${live.rephrased || '(none)'}`,
    '=== SOCIAL SENTIMENT (X / Reddit / news) ===',
    socialBlock || '(none captured)',
    '=== READER GOOGLE QUESTIONS ===',
    questions || '(none)',
    '=== PEOPLE ALSO ASK ===',
    paa || '(none)',
  ].join('\n\n');
}

export async function POST(request: Request) {
  try {
    const { heading, content, score, liveCheck } = await request.json();

    const gate = await classifyEditorialContent(
      (heading as string) || '',
      (content as string) || ''
    );
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.message, code: gate.code, kind: gate.kind },
        { status: 400 }
      );
    }

    const result = await runCouncil({
      tool: 'suggest',
      content: `HEADLINE: ${heading ?? ''}

ARTICLE:
${content ?? ''}

CURRENT CITABILITY SCORE: ${score ?? 'unknown'}

=== LIVE CHECK RESULTS & SENTIMENTS (PRIMARY BASIS FOR ADVICE) ===
${formatLiveCheck(liveCheck as LiveCheckPayload | null)}

INSTRUCTIONS: Rank advice by impact. Every high-leverage suggestion should reference a Live check SOCIAL summary, reader question, or People Also Ask item when available.`,
    });

    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in desk-suggest:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}

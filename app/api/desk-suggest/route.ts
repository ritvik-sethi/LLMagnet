import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';
import { classifyEditorialContent } from '../_shared/articleGate';
import {
  formatLiveCheck,
  type LiveCheckPayload,
} from '../_shared/pipelineContext';

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

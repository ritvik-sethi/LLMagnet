import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';
import { classifyEditorialContent } from '../_shared/articleGate';

export async function POST(request: Request) {
  try {
    const { heading, content } = await request.json();
    const title = ((heading as string) || '').trim();
    const article = ((content as string) || '').trim();

    // Trends can start from a headline alone — only gate when a body is present
    if (article) {
      const gate = await classifyEditorialContent(title || 'Working headline', article);
      if (!gate.ok) {
        return NextResponse.json(
          { error: gate.message, code: gate.code, kind: gate.kind },
          { status: 400 }
        );
      }
    } else if (!title || title.length < 8) {
      return NextResponse.json(
        {
          error: 'ENTER A VALID PROMPT LINK — add a working headline or paste a news draft first.',
          code: 'NO_HEADLINE',
        },
        { status: 400 }
      );
    }

    const result = await runCouncil({
      tool: 'trends',
      content: `Working headline: ${title}\n\nDraft / notes:\n${article || '(blank — propose angles from the headline / topic alone)'}`,
    });

    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in trend alerts:', error);
    return NextResponse.json({ error: 'Failed to analyze trends' }, { status: 500 });
  }
}

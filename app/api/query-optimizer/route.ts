import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';
import { classifyEditorialContent } from '../_shared/articleGate';

export async function POST(request: Request) {
  try {
    const { content, metaTitle } = await request.json();
    const title = ((metaTitle as string) || '').trim();
    const article = ((content as string) || '').trim();

    const gate = await classifyEditorialContent(title, article);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.message, code: gate.code, kind: gate.kind },
        { status: 400 }
      );
    }

    const result = await runCouncil({
      tool: 'query-optimizer',
      content: `Headline: ${title}\n\nArticle:\n${article}`,
    });

    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in query optimizer:', error);
    return NextResponse.json({ error: 'Failed to analyze queries' }, { status: 500 });
  }
}

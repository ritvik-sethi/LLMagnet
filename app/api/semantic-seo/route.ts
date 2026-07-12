import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';
import { classifyEditorialContent, clampCiteScore } from '../_shared/articleGate';

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
      tool: 'semantic-seo',
      content: `Headline: ${title}\n\nArticle:\n${article}`,
    });

    return NextResponse.json({
      ...result,
      score: typeof result.score === 'number' ? clampCiteScore(result.score) : result.score,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in semantic SEO analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze content' }, { status: 500 });
  }
}

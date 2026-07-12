import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';

export async function POST(request: Request) {
  try {
    const { content, metaTitle } = await request.json();

    const result = await runCouncil({
      task: 'Assess the semantic relevance and knowledge-graph fit of this article for AI search, and score its citability.',
      content: `Meta Title: ${metaTitle ?? ''}\n\n${content ?? ''}`,
      requireScore: true,
    });

    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in semantic SEO analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze content' }, { status: 500 });
  }
}

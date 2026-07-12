import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';

export async function POST(request: Request) {
  try {
    const { content, metaTitle } = await request.json();

    const result = await runCouncil({
      task: 'Score this article for LLM-citability and content SEO, and coach how to improve it.',
      content: `Meta Title: ${metaTitle ?? ''}\n\n${content ?? ''}`,
      requireScore: true,
    });

    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in content SEO analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze content' }, { status: 500 });
  }
}

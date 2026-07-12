import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';

export async function POST(request: Request) {
  try {
    const { heading, content } = await request.json();

    const result = await runCouncil({
      task: 'Rewrite this article to maximize LLM citation potential while keeping it readable and trustworthy for a human reader.',
      content: `HEADING: ${heading ?? ''}\n\nCONTENT: ${content ?? ''}`,
      requireRewrite: true,
    });

    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in rewrite-for-llm:', error);
    return NextResponse.json({ error: 'Failed to rewrite content' }, { status: 500 });
  }
}

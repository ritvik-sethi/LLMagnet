import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';

export async function POST(request: Request) {
  try {
    const { content, metaTitle } = await request.json();

    const result = await runCouncil({
      task: 'Identify the search queries this article should rank and be cited for, and how to sharpen the content to win them.',
      content: `Meta Title: ${metaTitle ?? ''}\n\n${content ?? ''}`,
    });

    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in query optimizer:', error);
    return NextResponse.json({ error: 'Failed to analyze queries' }, { status: 500 });
  }
}

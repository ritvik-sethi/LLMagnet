import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';

export async function POST(request: Request) {
  try {
    const { yourContent, competitorContent } = await request.json();

    const result = await runCouncil({
      task: 'Identify the content gaps between this article and competitors covering the same Indian-startup story, and what to add to close them.',
      content: `YOUR ARTICLE:\n${yourContent ?? ''}\n\nCOMPETITOR COVERAGE:\n${competitorContent ?? '(none provided — infer typical competitor coverage for this topic)'}`,
    });

    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in competitor analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze competitor gap' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';

export async function POST(request: Request) {
  try {
    const { heading, content } = await request.json();

    const result = await runCouncil({
      task: 'Surface trending angles and topics an Indian-startup newsroom should cover around this draft, and how to frame them for discoverability.',
      content: `Working headline: ${heading ?? ''}\n\n${content ?? ''}`,
    });

    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in trend alerts:', error);
    return NextResponse.json({ error: 'Failed to analyze trends' }, { status: 500 });
  }
}

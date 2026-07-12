import OpenAI from 'openai';
import https from 'https';

// Shared citability scale — the single source of truth every scoring route
// emits against (KTD5). The client slice mirrors these bounds.
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

// Newsroom framing (KTD7 / R11): applied to every council call, no hard-coded
// entity data — just the lens.
const NEWSROOM_PREAMBLE = `You are assisting a reporter at a newsroom that covers Indian startups and companies — funding rounds, company profiles, sector and market stories. Your job is to help their article get discovered and cited by LLM-driven search (ChatGPT, Gemini, Claude) as well as traditional search engines.`;

export interface CouncilVoice {
  take: string;
  points: string[];
}

// The lean, flat two-voice shape returned by every tool (KTD3).
export interface CouncilResult {
  score?: number; // present + validated only for scoring routes
  reader: CouncilVoice; // The Reader — human clarity, story, trust
  machine: CouncilVoice; // The Machine — what LLMs parse and cite
  reconciledAction: string;
  rewrittenContent?: string; // present only for the Rewrite tool
}

// Lazily instantiated so importing this module (e.g. during `next build` page-data
// collection) does not require OPENAI_API_KEY to be present.
let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      httpAgent: new https.Agent({ rejectUnauthorized: false }),
    });
  }
  return client;
}

export interface RunCouncilOptions {
  task: string; // what this specific tool is analyzing for
  content: string; // the article/draft (plus any tool-specific context)
  requireScore?: boolean; // scoring routes only
  requireRewrite?: boolean; // Rewrite tool only — also return an improved draft
}

/**
 * Single lean OpenAI call that returns both council voices at once (KTD2).
 * Scoring routes pass requireScore=true and run at temperature 0 for a stable,
 * non-regressing number (KTD6); other routes use 0.2.
 */
export async function runCouncil(opts: RunCouncilOptions): Promise<CouncilResult> {
  const { task, content, requireScore = false, requireRewrite = false } = opts;

  const prompt = `${NEWSROOM_PREAMBLE}

TASK: ${task}

Evaluate the content below as a two-voice council and answer as BOTH voices:
- "reader" — The Reader: argues for the human audience (clarity, narrative, trust, readability, accuracy).
- "machine" — The Machine: argues for LLM consumption (structure, named entities, extractable facts, citability).
Where the two voices would disagree, give ONE "reconciledAction" the reporter should actually take.
${requireScore ? `Also return "score": an integer from ${SCORE_MIN} to ${SCORE_MAX} rating this content's LLM-citability. Anchor it to the rubric consistently so the same content scores the same each run.` : ''}
${requireRewrite ? 'Also return "rewrittenContent": a full improved version of the article that reconciles both voices.' : ''}

CONTENT:
${content}

Return ONLY a JSON object of exactly this shape:
{ ${requireScore ? '"score": number, ' : ''}${requireRewrite ? '"rewrittenContent": string, ' : ''}"reader": { "take": string, "points": string[] }, "machine": { "take": string, "points": string[] }, "reconciledAction": string }`;

  const completion = await getClient().chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4-turbo-preview',
    temperature: requireScore ? 0 : 0.2,
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(completion.choices[0].message.content || '{}') as CouncilResult;

  if (!parsed.reader || !parsed.machine) {
    throw new Error('Council response missing a voice');
  }
  parsed.reader.points = parsed.reader.points ?? [];
  parsed.machine.points = parsed.machine.points ?? [];
  parsed.reconciledAction = parsed.reconciledAction ?? '';

  if (requireScore) {
    const s = parsed.score;
    if (typeof s !== 'number' || Number.isNaN(s) || s < SCORE_MIN || s > SCORE_MAX) {
      // Reject rather than dispatch a drifted/missing score to the shared draft (KTD5).
      throw new Error('Council response missing a valid score');
    }
  }

  return parsed;
}

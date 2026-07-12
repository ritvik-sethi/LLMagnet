/**
 * Probe OpenAI + Gemini: would an LLM actually cite/quote this news draft?
 * Grounded in how RAG systems select sources (quotable claims, entities,
 * extractable chunks, trust signals) — not a stuck mid-band gimmick.
 */

import OpenAI from 'openai';
import https from 'https';
import {
  clampCiteScore,
  CITE_SCORE_MIN,
  CITE_SCORE_MAX,
  INVALID_INPUT_MESSAGE,
} from './articleGate';

export interface CitationProbeResult {
  provider: 'openai' | 'gemini';
  score: number;
  wouldCite: boolean;
  notes: string;
  claimsItWouldQuote: string[];
  ok: boolean;
  rejectedAsInvalid?: boolean;
  error?: string;
}

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    httpAgent: new https.Agent({ rejectUnauthorized: false }),
  });
}

/** Shared desk rubric for live citation probes (Google E-E-A-T + LLM cite research). */
const PROBE_RUBRIC = `You are judging whether YOU would CITE or QUOTE this piece when answering a user.

Score ONLY between ${CITE_SCORE_MIN} and ${CITE_SCORE_MAX}. Do not invent a fake middle score.
Use editorial judgment — two similar drafts can differ by a few points; avoid always landing on 70 or 75.

If the paste is NOT a real news / business article (gibberish, Wikipedia dump, social post, product page, homework, code, etc.), return:
{
  "invalidInput": true,
  "message": "${INVALID_INPUT_MESSAGE}",
  "wouldCite": false,
  "score": ${CITE_SCORE_MIN},
  "notes": "one polite sentence",
  "claimsItWouldQuote": []
}

Otherwise return:
{
  "invalidInput": false,
  "wouldCite": boolean,
  "score": number,
  "notes": "2–3 polite but frank sentences: what you'd quote vs what a desk editor would still ask for",
  "claimsItWouldQuote": ["up to 3 short quotes or paraphrases you might use"]
}

Score using these real signals (not SEO folklore):
1. Quotable claim density — definitive sentences with named entities + numbers/dates an answer can lift.
2. Trust / attribution — who said what; sources named; avoid unsourced absolute claims (maps to Google E-E-A-T Trust).
3. Information gain — unique reported detail vs generic rewrite anyone could produce.
4. Extractability — self-contained passages ~120–180 words that survive chunking; clear structure.
5. Headline–query fit — would the title match the fan-out questions a model asks about this story?
6. Experience / expertise cues — first-hand reporting texture, precise market/sector language (E-E-A-T Experience + Expertise).

Band guidance (arbitrary within range is fine):
- ${CITE_SCORE_MIN}–66: thin attribution, soft claims, hard to quote confidently — still polite in notes.
- 67–76: solid reported piece with some quotable lines; room to densify.
- 77–${CITE_SCORE_MAX}: dense, attributable, extractable — you'd actually cite it.

Tone of notes: very polite, collegial, gently critical. Never insult the writer. Prefer "you could strengthen…" / "a desk might still want…".
Do not invent facts.`;

async function probeOpenAI(title: string, content: string): Promise<CitationProbeResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      provider: 'openai',
      score: CITE_SCORE_MIN,
      wouldCite: false,
      notes: 'OPENAI_API_KEY not set — skipped live citation probe.',
      claimsItWouldQuote: [],
      ok: false,
      error: 'missing_key',
    };
  }

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `${PROBE_RUBRIC}

HEADLINE: ${title}
ARTICLE:
${content.slice(0, 6000)}

Imagine a user asks: "What should I know about this story?" Be honest about citeability.`,
        },
      ],
    });

    const raw = JSON.parse(completion.choices[0].message.content || '{}') as {
      invalidInput?: boolean;
      message?: string;
      wouldCite?: boolean;
      score?: number;
      notes?: string;
      claimsItWouldQuote?: string[];
    };

    if (raw.invalidInput) {
      return {
        provider: 'openai',
        score: CITE_SCORE_MIN,
        wouldCite: false,
        notes: raw.message || INVALID_INPUT_MESSAGE,
        claimsItWouldQuote: [],
        ok: false,
        rejectedAsInvalid: true,
        error: INVALID_INPUT_MESSAGE,
      };
    }

    return {
      provider: 'openai',
      score: clampCiteScore(typeof raw.score === 'number' ? raw.score : 68),
      wouldCite: Boolean(raw.wouldCite),
      notes: raw.notes || '',
      claimsItWouldQuote: (raw.claimsItWouldQuote || []).slice(0, 3),
      ok: true,
    };
  } catch (e) {
    return {
      provider: 'openai',
      score: CITE_SCORE_MIN,
      wouldCite: false,
      notes: '',
      claimsItWouldQuote: [],
      ok: false,
      error: e instanceof Error ? e.message : 'openai_probe_failed',
    };
  }
}

async function probeGemini(title: string, content: string): Promise<CitationProbeResult> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    return {
      provider: 'gemini',
      score: CITE_SCORE_MIN,
      wouldCite: false,
      notes: 'GEMINI_API_KEY not set — skipped Gemini citation probe.',
      claimsItWouldQuote: [],
      ok: false,
      error: 'missing_key',
    };
  }

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const prompt = `${PROBE_RUBRIC}

HEADLINE: ${title}
ARTICLE:
${content.slice(0, 6000)}

Imagine a user asks: "What should I know about this story?" Return ONLY JSON (no markdown).`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        provider: 'gemini',
        score: CITE_SCORE_MIN,
        wouldCite: false,
        notes: '',
        claimsItWouldQuote: [],
        ok: false,
        error: `gemini_http_${res.status}: ${errText.slice(0, 120)}`,
      };
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '{}';
    const raw = JSON.parse(text) as {
      invalidInput?: boolean;
      message?: string;
      wouldCite?: boolean;
      score?: number;
      notes?: string;
      claimsItWouldQuote?: string[];
    };

    if (raw.invalidInput) {
      return {
        provider: 'gemini',
        score: CITE_SCORE_MIN,
        wouldCite: false,
        notes: raw.message || INVALID_INPUT_MESSAGE,
        claimsItWouldQuote: [],
        ok: false,
        rejectedAsInvalid: true,
        error: INVALID_INPUT_MESSAGE,
      };
    }

    return {
      provider: 'gemini',
      score: clampCiteScore(typeof raw.score === 'number' ? raw.score : 68),
      wouldCite: Boolean(raw.wouldCite),
      notes: raw.notes || '',
      claimsItWouldQuote: (raw.claimsItWouldQuote || []).slice(0, 3),
      ok: true,
    };
  } catch (e) {
    return {
      provider: 'gemini',
      score: CITE_SCORE_MIN,
      wouldCite: false,
      notes: '',
      claimsItWouldQuote: [],
      ok: false,
      error: e instanceof Error ? e.message : 'gemini_probe_failed',
    };
  }
}

export async function runCitationProbes(
  title: string,
  content: string
): Promise<{
  openai: CitationProbeResult;
  gemini: CitationProbeResult;
  blendedScore: number;
  evidenceBlock: string;
  rejectedAsInvalid: boolean;
}> {
  const [openai, gemini] = await Promise.all([
    probeOpenAI(title, content),
    probeGemini(title, content),
  ]);

  const rejectedAsInvalid = Boolean(
    openai.rejectedAsInvalid || gemini.rejectedAsInvalid
  );

  const okScores = [openai, gemini].filter((p) => p.ok).map((p) => p.score);
  const blendedScore = clampCiteScore(
    okScores.length
      ? okScores.reduce((a, b) => a + b, 0) / okScores.length
      : CITE_SCORE_MIN + 5
  );

  const evidenceBlock = [
    '=== LIVE LLM CITATION PROBES (score must reflect these — not a stuck midpoint) ===',
    `OpenAI: score=${openai.score}/${CITE_SCORE_MAX} band · wouldCite=${openai.wouldCite} · ok=${openai.ok}`,
    openai.notes ? `OpenAI notes: ${openai.notes}` : '',
    openai.claimsItWouldQuote.length
      ? `OpenAI would quote: ${openai.claimsItWouldQuote.join(' | ')}`
      : '',
    openai.error ? `OpenAI probe: ${openai.error}` : '',
    `Gemini: score=${gemini.score}/${CITE_SCORE_MAX} band · wouldCite=${gemini.wouldCite} · ok=${gemini.ok}`,
    gemini.notes ? `Gemini notes: ${gemini.notes}` : '',
    gemini.claimsItWouldQuote.length
      ? `Gemini would quote: ${gemini.claimsItWouldQuote.join(' | ')}`
      : '',
    gemini.error ? `Gemini probe: ${gemini.error}` : '',
    `Blended probe score (pre-council): ${blendedScore}`,
    'Desk rule: stay polite-critical; use editorial judgment inside the 60–85 band; never invent facts.',
  ]
    .filter(Boolean)
    .join('\n');

  return { openai, gemini, blendedScore, evidenceBlock, rejectedAsInvalid };
}

/** Blend council matrix score with live OpenAI/Gemini probes; land in 60–85. */
export function blendCiteabilityScore(councilScore: number, probeBlended: number): number {
  // Probes weigh more so the number moves with real LLM cite behavior
  const mixed = 0.42 * councilScore + 0.58 * probeBlended;
  return clampCiteScore(mixed);
}

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
  /** True when provider is intentionally not run (e.g. no GEMINI_API_KEY). */
  skipped?: boolean;
  rejectedAsInvalid?: boolean;
  error?: string;
}

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    httpAgent: new https.Agent({ rejectUnauthorized: false }),
  });
}

/** Shared edit rubric for live citation probes (Google E-E-A-T + LLM cite research). */
const PROBE_RUBRIC = `You are judging whether YOU would CITE or QUOTE this piece when answering a user about THIS story.

IMPORTANT: Respond with a single valid JSON object only (no markdown fences).

Score ONLY between ${CITE_SCORE_MIN} and ${CITE_SCORE_MAX}. Be honestly arbitrary within that band — different articles MUST land on different numbers. Never default to a round midpoint (50/60/70/75/80).

If the paste is NOT a real news / business article (gibberish, Wikipedia dump, social post, product page, homework, code, etc.), return this JSON:
{
  "invalidInput": true,
  "message": "${INVALID_INPUT_MESSAGE}",
  "wouldCite": false,
  "score": ${CITE_SCORE_MIN},
  "notes": "one sentence naming what kind of non-article this is",
  "claimsItWouldQuote": [],
  "refuseReasons": ["why you would not cite"]
}

Otherwise return this JSON:
{
  "invalidInput": false,
  "wouldCite": boolean,
  "score": number,
  "notes": "3–5 frank sentences. MUST name specific companies/people/numbers from THIS draft. MUST say exactly which sentence you would lift and which claim you would refuse. Ban empty coaching like 'add more keywords' or 'improve readability'.",
  "claimsItWouldQuote": ["up to 4 SHORT verbatim-ish lifts from the draft — include a number or name in each"],
  "refuseReasons": ["up to 3 concrete refuse reasons tied to THIS draft, e.g. '₹ round size unsourced in graf 2'"]
}

Score using these real signals:
1. Quotable claim density — definitive sentences with named entities + ₹/$ / dates.
2. Trust / attribution — who said what; sources named (E-E-A-T Trust).
3. Information gain — unique reported detail vs a generic rewrite of the headline.
4. Extractability — self-contained 120–180 word chunks; clear hierarchy.
5. Headline–query fit — would THIS title match fan-out questions about the story?
6. India business texture — funding vocabulary, regulatory names (SEBI/RBI/DPIIT when relevant), founder/investor names, metro vs market stakes.

Band guidance (spread scores — do not cluster):
- ${CITE_SCORE_MIN}–52: soft, thin, hard to quote — still name what is missing.
- 53–68: some quotable lines; big densify opportunities.
- 69–82: solid reported piece; selective cite with caveats.
- 83–${CITE_SCORE_MAX}: dense, attributable, extractable — you would actually cite it.

Tone: collegial and precise. Never insult the writer. Never invent facts.`;

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
      temperature: 0.55,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `${PROBE_RUBRIC}

HEADLINE: ${title}
ARTICLE:
${content.slice(0, 7000)}

Imagine a user asks about the companies and stakes in THIS story. Be honest about citeability. Return JSON.`,
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
      refuseReasons?: string[];
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

    const refuse = Array.isArray(raw.refuseReasons)
      ? raw.refuseReasons.filter((r) => typeof r === 'string').slice(0, 3)
      : [];
    const notesBase = raw.notes || '';
    const notes =
      refuse.length > 0
        ? `${notesBase}${notesBase ? ' ' : ''}Would refuse: ${refuse.join('; ')}`
        : notesBase;

    return {
      provider: 'openai',
      score: clampCiteScore(
        typeof raw.score === 'number' ? raw.score : CITE_SCORE_MIN + 18
      ),
      wouldCite: Boolean(raw.wouldCite),
      notes,
      claimsItWouldQuote: (raw.claimsItWouldQuote || []).slice(0, 4),
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
    // Gemini optional for now — skip quietly (no error UI)
    return {
      provider: 'gemini',
      score: 0,
      wouldCite: false,
      notes: '',
      claimsItWouldQuote: [],
      ok: false,
      skipped: true,
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
        generationConfig: { temperature: 0.55, responseMimeType: 'application/json' },
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
      score: clampCiteScore(typeof raw.score === 'number' ? raw.score : CITE_SCORE_MIN + 18),
      wouldCite: Boolean(raw.wouldCite),
      notes: raw.notes || '',
      claimsItWouldQuote: (raw.claimsItWouldQuote || []).slice(0, 4),
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
  // OpenAI is required; Gemini only runs when GEMINI_API_KEY is set
  const openai = await probeOpenAI(title, content);
  const gemini = await probeGemini(title, content);

  const rejectedAsInvalid = Boolean(
    openai.rejectedAsInvalid || (!gemini.skipped && gemini.rejectedAsInvalid)
  );

  const okScores = [openai, gemini].filter((p) => p.ok && !p.skipped).map((p) => p.score);
  const blendedScore = clampCiteScore(
    okScores.length
      ? okScores.reduce((a, b) => a + b, 0) / okScores.length
      : CITE_SCORE_MIN + 5
  );

  const evidenceLines = [
    '=== LIVE LLM CITATION PROBES (score must reflect these — not a stuck midpoint) ===',
    `OpenAI: score=${openai.score}/${CITE_SCORE_MAX} band · wouldCite=${openai.wouldCite} · ok=${openai.ok}`,
    openai.notes ? `OpenAI notes: ${openai.notes}` : '',
    openai.claimsItWouldQuote.length
      ? `OpenAI would quote: ${openai.claimsItWouldQuote.join(' | ')}`
      : '',
    openai.error ? `OpenAI probe: ${openai.error}` : '',
  ];

  if (!gemini.skipped) {
    evidenceLines.push(
      `Gemini: score=${gemini.score}/${CITE_SCORE_MAX} band · wouldCite=${gemini.wouldCite} · ok=${gemini.ok}`,
      gemini.notes ? `Gemini notes: ${gemini.notes}` : '',
      gemini.claimsItWouldQuote.length
        ? `Gemini would quote: ${gemini.claimsItWouldQuote.join(' | ')}`
        : '',
      gemini.error ? `Gemini probe: ${gemini.error}` : ''
    );
  } else {
    evidenceLines.push('Gemini: skipped (no GEMINI_API_KEY) — score from OpenAI probe only.');
  }

  evidenceLines.push(
    `Blended probe score (pre-council): ${blendedScore}`,
    `Edit rule: stay precise; use editorial judgment inside the ${CITE_SCORE_MIN}–${CITE_SCORE_MAX} band; never invent facts; never soft-coach.`
  );

  const evidenceBlock = evidenceLines.filter(Boolean).join('\n');

  return { openai, gemini, blendedScore, evidenceBlock, rejectedAsInvalid };
}

/** Blend council matrix score with live OpenAI/Gemini probes. */
export function blendCiteabilityScore(councilScore: number, probeBlended: number): number {
  const mixed = 0.42 * councilScore + 0.58 * probeBlended;
  return clampCiteScore(mixed);
}

import OpenAI from 'openai';
import https from 'https';

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

export type ToolId =
  | 'content-seo'
  | 'semantic-seo'
  | 'rewrite'
  | 'suggest'
  | 'live-check'
  | 'query-optimizer'
  | 'competitor'
  | 'trends';

export interface CouncilVoice {
  take: string;
  points: string[];
  suggestions: string[];
}

export interface MatrixAxisScore {
  id: string;
  label: string;
  max: number;
  score: number;
  note: string;
}

export interface QueryArtifact {
  query: string;
  intent: string;
  citationPotential: number;
  why: string;
}

export interface TrendArtifact {
  angle: string;
  whyNow: string;
  howToFrame: string;
}

export interface GapArtifact {
  gap: string;
  severity: 'high' | 'medium' | 'low';
  howToClose: string;
}

export interface RewriteChange {
  type: 'add' | 'edit' | 'remove';
  original?: string;
  revised?: string;
  reason: string;
}

export interface CouncilResult {
  score?: number;
  breakdown?: MatrixAxisScore[];
  humanEdge: CouncilVoice;
  seoEditor: CouncilVoice;
  /** Explicit reader-vs-AI contrast for this article */
  comparison?: {
    readerLens: string;
    aiLens: string;
    whereTheyClash: string;
  };
  reconciledAction: string;
  rewrittenContent?: string;
  /** Plain list of what was woven into the polish (shown at the end, not as markup) */
  additions?: string[];
  changes?: RewriteChange[];
  shouldRewrite?: boolean;
  rewritePitch?: string;
  queries?: QueryArtifact[];
  trends?: TrendArtifact[];
  gaps?: GapArtifact[];
  liveVerdict?: string;
}

/** Agent-grade edit system: plan → evidence → act. No fluff. */
const AGENT_PREAMBLE = `You are a supportive senior newsroom editor coaching a working reporter. Your job is to strengthen THIS article — never to belittle the writer.

Operating rules (non-negotiable):
1. FOLLOW THE ARTICLE CLOSELY. Every point and suggestion MUST quote or paraphrase a specific phrase, name, number, or paragraph from THIS draft. Ban generic advice ("add more keywords", "improve readability", "use headings").
2. Never invent facts. Use [NEED: …] when something must be reported.
3. Advice must be article-specific and actionable on this exact copy.
4. When web/X/competitor evidence is provided, tie advice to that evidence AND to the draft.
5. TONE: Extremely polite while still critically useful. Soften the edge, keep the substance.
   Frame gaps as opportunities ("You could strengthen…", "A reader may also want…", "An editor might still ask for…", "Consider adding…").
   NEVER use dismissive or insulting language such as: vague, weak, lazy, poor, bad, confusing, pointless, amateur, fails, worthless, "this doesn't work", "no one will read".
6. Prefer "opportunity" / "could go further" / "readers may still wonder" over harsh criticism.
7. When scoring: use real editorial judgment (slightly arbitrary within the allowed band is fine). Do not always land on round midpoints. Do not invent a gimmick score.`;

const VOICE_BLOCK = `You MUST answer as TWO sharply different editors. They are NOT allowed to say the same things.
Stay constructive and respectful toward the writer in BOTH voices.

═══════════════════════════════════════
humanEdge = THE READER (human audience)
═══════════════════════════════════════
Lens: Would a busy human finish this? Trust it? Feel the story?
ONLY talk about: narrative hook, clarity of who/what/why, stakes, human context, lede/kicker, quote voice, fairness/trust.
FORBIDDEN for this voice: "LLM", "citation", "entities for AI", "schema", "query matching", "extractable facts for models".
FORBIDDEN tone words: vague, weak, bad, poor, lazy, confusing (as insults). Use constructive phrasing instead.
Every point MUST include a short quote from the draft in quotation marks.

═══════════════════════════════════════
seoEditor = THE MACHINE / AI CITATION EDITOR
═══════════════════════════════════════
Lens: Would ChatGPT / Gemini / Claude confidently quote this when answering a user?
ONLY talk about: quotable definitive sentences, named entities, numbers/dates, structure AI can parse, FAQ/Q&A opportunities, claim density, what query this could win.
FORBIDDEN for this voice: "readers will bounce", "story arc", "emotional resonance" as the main point.
FORBIDDEN tone words: same list as above — stay collegial.
Every point MUST include a short quote from the draft in quotation marks OR name a missing citable fact tied to a line in the draft — framed as an addition opportunity.

═══════════════════════════════════════
HARD SEPARATION
═══════════════════════════════════════
- humanEdge.points and seoEditor.points must NOT overlap in meaning.
- Also return "comparison": {
    "readerLens": "1–2 constructive sentences: what a human reader still needs from THIS piece",
    "aiLens": "1–2 constructive sentences: what would help an AI cite THIS piece",
    "whereTheyClash": "1 sentence: the main tension between those needs on THIS draft (neutral, not insulting)"
  }
- "reconciledAction": ONE supportive next edit that serves both.

Each voice shape:
{ "take": 2–4 constructive sentences about THIS article only, "points": 3–5 bullets each with a draft quote, "suggestions": 2–4 concrete edits naming the paragraph/claim to strengthen }`;

interface ToolProfile {
  deskBrief: string;
  matrix?: { id: string; label: string; max: number; rubric: string }[];
  requireScore?: boolean;
  requireRewrite?: boolean;
  requireSuggest?: boolean;
  artifacts?: 'queries' | 'trends' | 'gaps';
}

const TOOLS: Record<ToolId, ToolProfile> = {
  'content-seo': {
    requireScore: true,
    deskBrief: `TOOL: Score — deep citeability review for THIS news article
You receive Live OpenAI + Gemini citation probes. Overall "score" MUST be 60–85 and MUST move with those probes (never stuck near 70).
Use editorial judgment inside that band — a few points of honest variance is expected; avoid gimmicky midpoints.
Ground scoring in real signals (not folklore):
• Google E-E-A-T (Experience, Expertise, Authoritativeness, Trust) — Trust is central: attribution, accuracy cues, honesty of claims.
• LLM citation research: quotable claim density; named entities + numbers; extractable 120–180-word chunks; headline–query / fan-out fit; information gain vs generic rewrite.
Matrix notes MUST quote the draft OR probe notes (a name, number, missing attribution). Stay polite-critical.
Reader voice: how the story lands for humans. Machine voice: how citeable those same lines are — reference probe wouldCite / notes. Do not merge them.`,
    matrix: [
      {
        id: 'citationPotential',
        label: 'LLM Citation Potential',
        max: 22,
        rubric:
          'Would ChatGPT/Gemini lift a sentence from THIS draft? Align with live probes; weigh quotable definitive lines.',
      },
      {
        id: 'factualAuthority',
        label: 'Claim Density & Entities',
        max: 18,
        rubric:
          'Named companies/people + figures/dates HERE. Sparse soft claims score lower; densified attributable facts score higher.',
      },
      {
        id: 'informationDensity',
        label: 'Information Gain',
        max: 18,
        rubric:
          'Unique reported detail a model cannot get from a generic rewrite. Who/what/when/how much depth in THIS piece.',
      },
      {
        id: 'structuralAccessibility',
        label: 'Extractable Structure',
        max: 14,
        rubric:
          'Self-contained passages, clear hierarchy, lead-worthy answers near the top — what survives RAG chunking.',
      },
      {
        id: 'headingOptimization',
        label: 'Headline–Query Fit',
        max: 14,
        rubric:
          'Does THIS headline match fan-out questions a user/LLM would ask about the story?',
      },
      {
        id: 'sourceCredibility',
        label: 'Trust & Attribution (E-E-A-T)',
        max: 14,
        rubric:
          'Score attribution and trust cues on THIS draft. In the note, briefly explain E-E-A-T for the reporter: Experience (first-hand reporting texture), Expertise (precise sector knowledge), Authoritativeness (go-to source signals), Trust (accuracy/honesty — the center of E-E-A-T). Tie the note to named attribution or missing sources in THIS piece. Unsourced absolutes lower this axis — stay polite.',
      },
    ],
  },

  'semantic-seo': {
    requireScore: true,
    deskBrief: `TOOL: Semantic fit — entities & relationships IN THIS article
Overall "score" MUST be 60–85. Use polite-critical editorial judgment; do not invent a gimmick midpoint.
Reader: can a human track who did what to whom? Machine: are entities explicit enough for AI to extract? Quote the draft.`,
    matrix: [
      { id: 'entityClarity', label: 'Entity Clarity', max: 22, rubric: 'Companies/people named cleanly in THIS draft.' },
      { id: 'relationshipMapping', label: 'Relationship Mapping', max: 18, rubric: 'Funding/competition/role links stated HERE.' },
      { id: 'topicHierarchy', label: 'Topic Hierarchy', max: 18, rubric: 'Section logic / extractable hierarchy of THIS piece.' },
      { id: 'queryCoverage', label: 'Query / Fan-out Coverage', max: 16, rubric: 'Questions THIS draft actually answers.' },
      { id: 'schemaReadiness', label: 'Fact Structure', max: 13, rubric: 'Facts structured enough to lift without ambiguity.' },
      { id: 'semanticMarkers', label: 'Context Markers', max: 13, rubric: 'Definitions/context cues that reduce mis-citation HERE.' },
    ],
  },

  'live-check': {
    deskBrief: `TOOL: Live check — reader questions + SOCIAL sentiment (X, Reddit, fresh news)
You receive: a rephrased search phrase, SOCIAL items (tweets / Reddit / news with summaries), user questions Google returns, and People Also Ask.
Reader: what sentiment or open questions from SOCIAL should the draft address? Frame as opportunities.
Machine: which questions / SOCIAL threads currently cite OTHER sites — what could help THIS draft earn those answers?
Quote the draft. Name specific SOCIAL links or questions. Be constructive — never insult the writer.
Return "liveVerdict" (2–3 supportive sentences) naming 1–2 SOCIAL items or questions.`,
  },

  suggest: {
    requireSuggest: true,
    deskBrief: `TOOL: Advice before polish — GROUNDED IN LIVE CHECK
You receive THIS draft PLUS Live check evidence: SOCIAL items (X / Reddit / news with sentiment summaries), reader Google questions, People Also Ask, and the live editor verdict.

MANDATORY:
1. Base advice primarily on that Live check evidence — cite specific SOCIAL summaries, questions, or sentiment when recommending edits.
2. Reader suggestions = story/clarity/trust moves that answer what humans are asking/feeling on X/Reddit (name the SOCIAL item or question).
3. Machine suggestions = citation moves that help THIS draft win the Google/LLM questions Live check surfaced (name the question or rival angle).
4. Do NOT give generic SEO tips. Every point must tie draft quote → Live check signal → concrete edit.
5. If Live check evidence is missing, say so briefly and give draft-only advice as fallback.
No overlapping suggestions. Set shouldRewrite + rewritePitch for THIS piece.`,
  },

  rewrite: {
    requireRewrite: true,
    deskBrief: `TOOL: Full polish — Indian business newsroom rewrite
ROLE: You are a senior editor at an Indian business newsroom (think Inc42 / Economic Times). You rewrite for Indian founders, investors, and operators. Your polish should:
- Cite and densify FACTS from the web research (names, rounds, valuations, market numbers, dates, rivals).
- Sound OPINIONATED in the newsroom sense: sharp framing, stakes, "what this means for India's startup market" — woven into the prose, never labelled "Opinion:" or called out as opinion.
- Allow careful SPECULATION where research supports it ("If this holds…", "One reading is…", "Investors may see…") — still never invent hard numbers.
- Edit MORE than a light touch-up: restructure ledes, tighten soft passages, deepen 5+ claims, add context paragraphs where a senior editor would.
- MUST honour PRIOR PIPELINE CONTEXT when provided: apply Live check signals and Advice suggestions (human + machine) in the rewrite — do not ignore them.

You receive: (A) original article, (B) ≥5 claims each with web search + scraped sources, (C) prior score / live check / advice when available.

MANDATORY:
1. Preserve the reporter's core story and accurate facts already in the draft.
2. Produce a SUBSTANTIAL rewrite — longer / denser where research allows; not a near-copy with a few inserts.
3. Densify ≥5 claims with verified detail; never invent. Use [NEED: …] when a fact is missing.
4. Do NOT add lines that say "In our opinion" / "Opinion:" / "Editor's note: opinion". Judgment and speculation must read as natural business reporting.
5. If prior Advice lists concrete edits, fold those in (or note in additions why a suggestion was skipped).
6. humanEdge: does the polished piece still read as a human story for Indian readers? seoEditor: are the densified claims citable? DIFFERENT takes; quote rewritten lines.
Return rewrittenContent + additions (8–15 short bullets of what you added or strengthened — facts, framing, context — no colour-coded markup).`,
  },

  'query-optimizer': {
    artifacts: 'queries',
    deskBrief: `TOOL: Queries THIS story should win
Reader: which questions would a human ask after reading THIS draft?
Machine: which queries would make an AI cite THIS draft?
Return 6–10 queries tied to claims actually in the article.`,
  },

  competitor: {
    artifacts: 'gaps',
    deskBrief: `TOOL: Rival gaps vs OUR draft (deep dig)
You receive: OUR article, the Google + LLM-style searches used to find rivals, and FULL scrapes from OTHER outlets only (source site excluded).

Reader gaps: story, context, quotes, stakes humans get from rivals but not from US — name the rival title/site.
Machine gaps: citable facts, numbers, timelines, definitions rivals have that an LLM would prefer over US.
Also note 1–2 strengths OUR piece uniquely owns (so the editor isn't only told what's missing).
If PRIOR PIPELINE CONTEXT is provided (score / live check / advice), use it to prioritize which gaps matter most right now.
Stay constructive toward the writer. Quote OUR draft and rival titles. Return 5–10 gaps (severity high/medium/low).`,
  },

  trends: {
    artifacts: 'trends',
    deskBrief: `TOOL: Angles for THIS topic/draft
Reader: which angle makes a compelling human story from THIS material?
Machine: which angle is most citeable/searchable now?
4–6 angles, grounded in the draft or headline.`,
  },
};

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

function emptyVoice(): CouncilVoice {
  return { take: '', points: [], suggestions: [] };
}

function normalizeVoice(raw: Partial<CouncilVoice> | undefined): CouncilVoice {
  return {
    take: raw?.take ?? '',
    points: raw?.points ?? [],
    suggestions: raw?.suggestions ?? [],
  };
}

export interface RunCouncilOptions {
  tool: ToolId;
  content: string;
}

export interface ExtractedClaim {
  claim: string;
  searchQuery: string;
}

/** Pull 5–7 factual claims from a draft for per-claim web research. */
export async function extractArticleClaims(
  heading: string,
  content: string
): Promise<ExtractedClaim[]> {
  const completion = await getClient().chat.completions.create({
    messages: [
      {
        role: 'user',
        content: `You are a newsroom researcher. From this article, extract 5 to 7 discrete FACTUAL claims worth verifying on the web (funding amounts, company actions, market stats, dates, named deals, regulatory moves).

HEADLINE: ${heading}
ARTICLE:
${content}

Return ONLY JSON:
{ "claims": [ { "claim": "one sentence claim from the draft", "searchQuery": "precise Google query to verify/expand this claim" } ] }

Rules: claims must appear in or be clearly implied by the draft. searchQuery should be specific (include company names, numbers if present). Exactly 5–7 claims.`,
      },
    ],
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}') as {
    claims?: ExtractedClaim[];
  };
  const claims = Array.isArray(raw.claims) ? raw.claims : [];
  return claims
    .filter((c) => c?.claim && c?.searchQuery)
    .slice(0, 7);
}

export async function runCouncil(opts: RunCouncilOptions): Promise<CouncilResult> {
  const profile = TOOLS[opts.tool];
  const matrixBlock = profile.matrix
    ? profile.matrix.map((a) => `- ${a.id} ("${a.label}", 0–${a.max}): ${a.rubric}`).join('\n')
    : '';

  const scoreInstructions = profile.requireScore
    ? `Return "score" (integer 60–85 only — editorial judgment inside that band; no gimmick midpoints) and "breakdown": [{ "id","label","max","score","note" }, ...] for every axis. Axis "max" values MUST sum to exactly 100. Axis "score" values MUST sum to exactly the overall "score". Axis notes must be polite-critical and quote the draft.`
    : '';

  const rewriteInstructions = profile.requireRewrite
    ? `Return "rewrittenContent" (full polished article) and "additions": string[] — 8–15 short bullets listing what you added or strengthened (e.g. "Added Series B size from TechCrunch", "Framed India market stakes in lede"). Do not return colour-coded diffs.`
    : '';

  const suggestInstructions = profile.requireSuggest
    ? `Return "shouldRewrite": boolean and "rewritePitch": string.`
    : '';

  const artifactInstructions =
    profile.artifacts === 'queries'
      ? `Return "queries": [{ "query","intent","citationPotential","why" }, ...] (6–10).`
      : profile.artifacts === 'trends'
        ? `Return "trends": [{ "angle","whyNow","howToFrame" }, ...] (4–6).`
        : profile.artifacts === 'gaps'
          ? `Return "gaps": [{ "gap","severity","howToClose" }, ...] (4–8).`
          : '';

  const liveExtra =
    opts.tool === 'live-check' ? `Return "liveVerdict": string.` : '';

  const prompt = `${AGENT_PREAMBLE}

${VOICE_BLOCK}

${profile.deskBrief}
${matrixBlock}

${scoreInstructions}
${rewriteInstructions}
${suggestInstructions}
${artifactInstructions}
${liveExtra}

DRAFT / CONTEXT:
${opts.content}

Return ONLY valid JSON:
{
  ${profile.requireScore ? '"score": number, "breakdown": [...], ' : ''}
  ${profile.requireRewrite ? '"rewrittenContent": string, "additions": string[], ' : ''}
  ${profile.requireSuggest ? '"shouldRewrite": boolean, "rewritePitch": string, ' : ''}
  ${opts.tool === 'live-check' ? '"liveVerdict": string, ' : ''}
  ${profile.artifacts ? `"${profile.artifacts}": [...], ` : ''}
  "comparison": { "readerLens": string, "aiLens": string, "whereTheyClash": string },
  "humanEdge": { "take", "points", "suggestions" },
  "seoEditor": { "take", "points", "suggestions" },
  "reconciledAction": string
}`;

  const completion = await getClient().chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
    temperature: profile.requireScore ? 0 : 0.2,
    response_format: { type: 'json_object' },
  });

  const raw = JSON.parse(completion.choices[0].message.content || '{}') as Record<string, unknown>;

  const humanEdge = normalizeVoice(
    (raw.humanEdge as CouncilVoice) || (raw.reader as CouncilVoice) || emptyVoice()
  );
  const seoEditor = normalizeVoice(
    (raw.seoEditor as CouncilVoice) || (raw.machine as CouncilVoice) || emptyVoice()
  );

  if (!humanEdge.take && !seoEditor.take) {
    throw new Error('Council response missing both editor voices');
  }

  const result: CouncilResult = {
    humanEdge,
    seoEditor,
    reconciledAction: (raw.reconciledAction as string) || '',
  };

  const comparison = raw.comparison as CouncilResult['comparison'] | undefined;
  if (comparison && typeof comparison === 'object') {
    result.comparison = {
      readerLens: comparison.readerLens || '',
      aiLens: comparison.aiLens || '',
      whereTheyClash: comparison.whereTheyClash || '',
    };
  }

  if (profile.requireScore) {
    const s = raw.score;
    if (typeof s !== 'number' || Number.isNaN(s) || s < SCORE_MIN || s > SCORE_MAX) {
      throw new Error('Council response missing a valid score');
    }
    // Product band for news citeability: 60–85 (final clamp also applied in content-seo)
    const clamped = Math.min(85, Math.max(60, Math.round(s)));
    result.score = clamped;
    const breakdown = Array.isArray(raw.breakdown) ? (raw.breakdown as MatrixAxisScore[]) : [];
    result.breakdown = breakdown.map((b) => ({
      id: b.id,
      label: b.label,
      max: Number(b.max) || 0,
      score: Number(b.score) || 0,
      note: b.note || '',
    }));
  }

  if (profile.requireRewrite) {
    result.rewrittenContent = (raw.rewrittenContent as string) || '';
    const additions = Array.isArray(raw.additions)
      ? (raw.additions as string[]).filter((a) => typeof a === 'string' && a.trim())
      : [];
    // Fallback: older "changes" reasons if model still returns them
    if (additions.length === 0 && Array.isArray(raw.changes)) {
      result.additions = (raw.changes as RewriteChange[])
        .map((c) => c.reason)
        .filter(Boolean);
    } else {
      result.additions = additions;
    }
    result.changes = Array.isArray(raw.changes) ? (raw.changes as RewriteChange[]) : [];
  }

  if (profile.requireSuggest) {
    result.shouldRewrite = Boolean(raw.shouldRewrite);
    result.rewritePitch = (raw.rewritePitch as string) || '';
  }

  if (opts.tool === 'live-check') {
    result.liveVerdict = (raw.liveVerdict as string) || '';
  }

  if (profile.artifacts === 'queries' && Array.isArray(raw.queries)) {
    result.queries = raw.queries as QueryArtifact[];
  }
  if (profile.artifacts === 'trends' && Array.isArray(raw.trends)) {
    result.trends = raw.trends as TrendArtifact[];
  }
  if (profile.artifacts === 'gaps' && Array.isArray(raw.gaps)) {
    result.gaps = raw.gaps as GapArtifact[];
  }

  return result;
}

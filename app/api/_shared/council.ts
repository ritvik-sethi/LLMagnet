import OpenAI from 'openai';
import https from 'https';
import { CITE_SCORE_MIN, CITE_SCORE_MAX, clampCiteScore } from './articleGate';

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

export interface CiteEntityRow {
  name: string;
  role: string;
  citableFact: string;
}

export interface CiteClaimAudit {
  claim: string;
  wouldCite: boolean;
  missing: string;
  fix: string;
}

export interface CiteLedger {
  entities: CiteEntityRow[];
  claimAudits: CiteClaimAudit[];
  deskMoves: string[];
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
  /** Claim/entity ledger — the valuable backbone detail for scoring tools */
  citeLedger?: CiteLedger;
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
const AGENT_PREAMBLE = `You are a senior newsroom editor coaching a working reporter on THIS exact draft.

Operating rules (non-negotiable):
1. FOLLOW THE ARTICLE CLOSELY. Every point and suggestion MUST quote or paraphrase a specific phrase, name, number, or paragraph from THIS draft.
2. BAN GENERIC ADVICE. Forbidden phrases (and close cousins): "add more keywords", "improve readability", "use headings", "strengthen E-E-A-T", "consider adding more detail", "readers may also want", "you could strengthen", "an editor might still ask". Replace any of those with a concrete edit naming the graf, company, and missing number/source.
3. Never invent facts. Use [NEED: …] when something must be reported.
4. Advice must be article-specific and actionable — name the paragraph, the entity, and the fix.
5. TONE: Collegial and precise. Critically useful without insulting the writer.
6. When scoring: be honestly arbitrary inside the allowed band. Different articles MUST get different scores. Never park on round midpoints (40/50/60/70/75/80/90).`;

const VOICE_BLOCK = `You MUST answer as TWO sharply different editors. They are NOT allowed to say the same things.

═══════════════════════════════════════
humanEdge = THE READER (human audience)
═══════════════════════════════════════
Lens: Would a busy human finish this? Trust it? Feel the stakes?
ONLY talk about: narrative hook, clarity of who/what/why, stakes, human context, lede/kicker, quote voice, fairness/trust.
FORBIDDEN for this voice: "LLM", "citation", "entities for AI", "schema", "query matching".
Every point MUST include a short quote from the draft in quotation marks AND name what to change in that graf.

═══════════════════════════════════════
seoEditor = THE MACHINE / AI CITATION EDITOR
═══════════════════════════════════════
Lens: Would ChatGPT / Gemini confidently quote this when answering a user?
ONLY talk about: quotable definitive sentences, named entities, ₹/$ / dates, extractable structure, claim density, which query this could win.
Every point MUST include a short quote OR name a missing citable fact tied to a line in the draft — with the exact fix ("Add Peak XV as lead in graf 3 with [NEED: cheque size]").

═══════════════════════════════════════
HARD SEPARATION
═══════════════════════════════════════
- humanEdge.points and seoEditor.points must NOT overlap in meaning.
- Also return "comparison": {
    "readerLens": "1–2 sentences naming what a human still needs from THIS piece (quote a graf)",
    "aiLens": "1–2 sentences naming what an answer engine would / would not lift (quote a claim)",
    "whereTheyClash": "one concrete clash on THIS draft"
  }
- reconciledAction: ONE next edit — name company + number/source + where to insert it.

Each voice shape:
{ "take": "string", "points": ["string with draft quote + fix"], "suggestions": ["string naming paragraph/claim"] }`;

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
    deskBrief: `TOOL: Score — deep citeability review for THIS news article (product backbone)
You receive: (1) deterministic article signals with seedScore, (2) live OpenAI/Gemini citation probes.
Overall "score" MUST be between 38 and 94 and MUST move with seedScore ± probes — never freeze near 70.
Be honestly arbitrary: two different drafts should not share the same score.
Ground scoring in:
• Deterministic signals (entities, money marks, attribution, dates, length)
• Google E-E-A-T Trust + attribution on THIS draft
• LLM cite signals: quotable claims, extractable chunks, headline–query fit, information gain
Matrix axis "note" format (REQUIRED): "Quote: «…» · Issue: … · Fix: …" — ban soft coaching.
Also return "citeLedger": {
  "entities": [{ "name","role","citableFact" }] (4–8 rows from THIS draft),
  "claimAudits": [{ "claim","wouldCite","missing","fix" }] (5–7 claim-level audits),
  "deskMoves": ["4–6 ultra-specific next edits naming graf + company + number/source"]
}
Reader voice ≠ machine voice. Reference probe wouldCite / notes and seed gaps.`,
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
Overall "score" MUST be 38–94. Use precise editorial judgment; spread scores; do not invent a midpoint.
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
ROLE: You are a senior editor at an Indian business newsroom. You rewrite for Indian founders, investors, and operators. Your polish should:
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

/** Models sometimes return { quote, fix } instead of strings — flatten for React. */
export function coerceText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(coerceText).filter(Boolean).join(' · ');
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const quote = coerceText(o.quote ?? o.Quote ?? o.text ?? o.point ?? o.claim);
    const issue = coerceText(o.issue ?? o.Issue ?? o.missing ?? o.problem);
    const fix = coerceText(o.fix ?? o.Fix ?? o.action ?? o.suggestion);
    const parts = [
      quote && (quote.startsWith('Quote:') || quote.startsWith('«') ? quote : `Quote: «${quote}»`),
      issue && (issue.startsWith('Issue:') ? issue : `Issue: ${issue}`),
      fix && (fix.startsWith('Fix:') ? fix : `Fix: ${fix}`),
    ].filter(Boolean);
    if (parts.length) return parts.join(' · ');
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return '';
}

function coerceTextList(value: unknown, limit = 8): string[] {
  if (!Array.isArray(value)) {
    const one = coerceText(value);
    return one ? [one] : [];
  }
  return value.map(coerceText).filter((s) => s.trim()).slice(0, limit);
}

function normalizeVoice(raw: Partial<CouncilVoice> | undefined): CouncilVoice {
  return {
    take: coerceText(raw?.take),
    points: coerceTextList(raw?.points, 6),
    suggestions: coerceTextList(raw?.suggestions, 6),
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
    ? `Return "score" (integer ${CITE_SCORE_MIN}–${CITE_SCORE_MAX} only — honestly arbitrary inside that band; never a round midpoint) and "breakdown": [{ "id","label","max","score","note" }, ...] for every axis. Axis "max" values MUST sum to exactly 100. Axis "score" values MUST sum to exactly the overall "score". Each axis "note" MUST use: Quote: «…» · Issue: … · Fix: …. Also return "citeLedger" with entities, claimAudits, deskMoves as specified in the desk brief.`
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
  "reconciledAction": string${profile.requireScore ? ',\n  "citeLedger": { "entities": [...], "claimAudits": [...], "deskMoves": [...] }' : ''}
}`;

  const completion = await getClient().chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
    temperature: profile.requireScore ? 0.45 : 0.2,
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
    reconciledAction: coerceText(raw.reconciledAction),
  };

  const comparison = raw.comparison as CouncilResult['comparison'] | undefined;
  if (comparison && typeof comparison === 'object') {
    result.comparison = {
      readerLens: coerceText(comparison.readerLens),
      aiLens: coerceText(comparison.aiLens),
      whereTheyClash: coerceText(comparison.whereTheyClash),
    };
  }

  if (profile.requireScore) {
    const s = raw.score;
    if (typeof s !== 'number' || Number.isNaN(s) || s < SCORE_MIN || s > SCORE_MAX) {
      throw new Error('Council response missing a valid score');
    }
    result.score = clampCiteScore(s);
    const breakdown = Array.isArray(raw.breakdown) ? (raw.breakdown as MatrixAxisScore[]) : [];
    result.breakdown = breakdown.map((b) => ({
      id: coerceText((b as { id?: unknown }).id) || 'axis',
      label: coerceText((b as { label?: unknown }).label) || 'Axis',
      max: Number(b.max) || 0,
      score: Number(b.score) || 0,
      note: coerceText((b as { note?: unknown }).note),
    }));

    const ledger = raw.citeLedger as Record<string, unknown> | undefined;
    if (ledger && typeof ledger === 'object') {
      const entities = Array.isArray(ledger.entities) ? ledger.entities : [];
      const claimAudits = Array.isArray(ledger.claimAudits) ? ledger.claimAudits : [];
      result.citeLedger = {
        entities: entities
          .slice(0, 8)
          .map((e) => {
            const row = (e || {}) as Record<string, unknown>;
            return {
              name: coerceText(row.name),
              role: coerceText(row.role),
              citableFact: coerceText(row.citableFact ?? row.fact),
            };
          })
          .filter((e) => e.name),
        claimAudits: claimAudits
          .slice(0, 7)
          .map((c) => {
            const row = (c || {}) as Record<string, unknown>;
            return {
              claim: coerceText(row.claim),
              wouldCite: Boolean(row.wouldCite),
              missing: coerceText(row.missing),
              fix: coerceText(row.fix),
            };
          })
          .filter((c) => c.claim),
        deskMoves: coerceTextList(ledger.deskMoves, 6),
      };
    }
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

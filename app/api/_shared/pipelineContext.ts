/**
 * Shared formatters so later pipeline steps receive prior-step context
 * (score → live check → advice → polish → rivals).
 */

export interface LiveSocial {
  kind?: string;
  title?: string;
  url?: string;
  site?: string;
  summary?: string;
}

export interface LiveCheckPayload {
  liveVerdict?: string;
  rephrased?: string;
  userQuestions?: string[];
  social?: LiveSocial[];
  peopleAlsoAsk?: { question?: string; snippet?: string }[];
}

export interface AdvicePayload {
  rewritePitch?: string;
  shouldRewrite?: boolean;
  humanSuggestions?: string[];
  machineSuggestions?: string[];
  reconciledAction?: string;
  comparison?: {
    readerLens?: string;
    aiLens?: string;
    whereTheyClash?: string;
  };
}

export function formatLiveCheck(live: LiveCheckPayload | null | undefined): string {
  if (!live) {
    return '(No Live check snapshot yet.)';
  }

  const socialBlock = (live.social || [])
    .slice(0, 12)
    .map(
      (s, i) =>
        `${i + 1}. [${(s.kind || 'item').toUpperCase()}] ${s.title || '(untitled)'}\n   ${s.url || ''}\n   Sentiment/summary: ${s.summary || '(none)'}`
    )
    .join('\n');

  const questions = (live.userQuestions || []).map((q, i) => `${i + 1}. ${q}`).join('\n');
  const paa = (live.peopleAlsoAsk || [])
    .slice(0, 8)
    .map((p, i) => `${i + 1}. ${p.question || ''}${p.snippet ? ` — ${p.snippet}` : ''}`)
    .join('\n');

  return [
    `LIVE EDITOR VERDICT: ${live.liveVerdict || '(none)'}`,
    `REPHRASED SEARCH USED: ${live.rephrased || '(none)'}`,
    '=== SOCIAL SENTIMENT (X / Reddit / news) ===',
    socialBlock || '(none captured)',
    '=== READER GOOGLE QUESTIONS ===',
    questions || '(none)',
    '=== PEOPLE ALSO ASK ===',
    paa || '(none)',
  ].join('\n\n');
}

export function formatAdvice(advice: AdvicePayload | null | undefined): string {
  if (!advice) {
    return '(No prior Advice step snapshot — polish from draft + research only.)';
  }

  const human = (advice.humanSuggestions || [])
    .slice(0, 6)
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');
  const machine = (advice.machineSuggestions || [])
    .slice(0, 6)
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');

  return [
    `REWRITE PITCH: ${advice.rewritePitch || '(none)'}`,
    `SHOULD REWRITE: ${advice.shouldRewrite === false ? 'no' : 'yes'}`,
    `RECONCILED NEXT EDIT: ${advice.reconciledAction || '(none)'}`,
    advice.comparison
      ? `READER LENS: ${advice.comparison.readerLens || '(none)'}\nAI LENS: ${advice.comparison.aiLens || '(none)'}\nCLASH: ${advice.comparison.whereTheyClash || '(none)'}`
      : '',
    '=== HUMAN-EDGE SUGGESTIONS (apply where still relevant) ===',
    human || '(none)',
    '=== MACHINE / CITATION SUGGESTIONS (apply where still relevant) ===',
    machine || '(none)',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function formatPipelineContext(opts: {
  score?: number | null;
  liveCheck?: LiveCheckPayload | null;
  advice?: AdvicePayload | null;
}): string {
  return [
    `CURRENT CITABILITY SCORE: ${opts.score ?? 'unknown'}`,
    '=== PRIOR LIVE CHECK (carry forward) ===',
    formatLiveCheck(opts.liveCheck),
    '=== PRIOR ADVICE (carry forward — honour these edits) ===',
    formatAdvice(opts.advice),
  ].join('\n\n');
}

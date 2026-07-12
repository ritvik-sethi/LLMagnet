/**
 * Deterministic article signals that seed citeability scoring.
 * Forces different drafts apart before the LLM judges — backbone variance.
 */

import { clampCiteScore, CITE_SCORE_MIN, CITE_SCORE_MAX } from './articleGate';

export interface ArticleScoreSignals {
  wordCount: number;
  namedEntitiesApprox: number;
  moneyMentions: number;
  dateMentions: number;
  attributionCues: number;
  quotedPassages: number;
  paragraphCount: number;
  /** Feature-seeded score before LLM blend (in product band). */
  seedScore: number;
  /** Tiny per-article jitter so near-identical drafts still diverge. */
  jitter: number;
  strengths: string[];
  gaps: string[];
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hashJitter(title: string, body: string): number {
  const s = `${title}\n${body.slice(0, 800)}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // -5 … +5 (unsigned so JS % can't go negative)
  return ((h >>> 0) % 11) - 5;
}

/** Rough proper-noun / acronym scan — not NER, but enough to separate soft vs dense copy. */
function countEntityish(text: string): number {
  const caps = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g) || [];
  const acronyms = text.match(/\b[A-Z]{2,6}\b/g) || [];
  const uniq = new Set([...caps, ...acronyms].map((x) => x.toLowerCase()));
  return uniq.size;
}

export function computeArticleScoreSignals(
  title: string,
  body: string
): ArticleScoreSignals {
  const text = `${title}\n${body}`;
  const words = wordCount(body);
  const entities = countEntityish(text);
  const money =
    (text.match(
      /₹|Rs\.?\s?\d|\$\s?\d|\d+(?:\.\d+)?\s?(?:Mn|Bn|Cr|crore|million|billion|lakh)/gi
    ) || []).length;
  const dates =
    (text.match(
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}|\b20\d{2}\b|\bQ[1-4]\s*FY\d{2}/gi
    ) || []).length;
  const attribution =
    (text.match(
      /\b(?:said|told|according to|sources|confirmed|announced|filed|reported|declined to comment)\b/gi
    ) || []).length;
  const quotes = (text.match(/[“"][^”"]{12,}[”"]/g) || []).length;
  const paras = body.split(/\n\s*\n/).filter((p) => p.trim().length > 40).length;

  const strengths: string[] = [];
  const gaps: string[] = [];

  if (entities >= 12) strengths.push(`${entities} distinct name-like entities in the draft`);
  else if (entities < 6) gaps.push('Few named companies/people — soft claims will not cite well');

  if (money >= 3) strengths.push(`${money} money / round-size markers (₹/$ / Mn / Cr)`);
  else gaps.push('Almost no hard money figures — densify funding, revenue, or market size');

  if (attribution >= 4) strengths.push(`${attribution} attribution / speech verbs`);
  else gaps.push('Thin attribution — name who said what, or mark [NEED: source]');

  if (dates >= 2) strengths.push(`${dates} date / quarter markers`);
  else gaps.push('Weak timeline anchors — add dated events or FY quarters');

  if (quotes >= 2) strengths.push(`${quotes} pull-quote-sized passages`);
  else if (quotes === 0) gaps.push('No attributed quotes for a model to lift');

  if (words >= 450) strengths.push(`${words}-word reported length`);
  else if (words < 220) gaps.push('Short body — models prefer denser reported chunks');

  if (paras >= 5) strengths.push(`${paras} usable paragraphs for chunking`);
  else gaps.push('Few paragraph breaks — harder to extract clean answer chunks');

  // Base inside band from features (arbitrary but reproducible)
  let raw =
    CITE_SCORE_MIN +
    8 +
    Math.min(14, Math.floor(entities / 2)) +
    Math.min(12, money * 3) +
    Math.min(8, dates * 2) +
    Math.min(10, Math.floor(attribution * 1.5)) +
    Math.min(6, quotes * 2) +
    Math.min(8, Math.floor(words / 120)) +
    Math.min(6, Math.floor(paras / 2));

  const jitter = hashJitter(title, body);
  raw += jitter;

  // Penalize soft copy hard
  if (money === 0 && attribution < 2) raw -= 8;
  if (entities < 5) raw -= 6;
  if (words < 180) raw -= 7;

  const seedScore = clampCiteScore(raw);

  return {
    wordCount: words,
    namedEntitiesApprox: entities,
    moneyMentions: money,
    dateMentions: dates,
    attributionCues: attribution,
    quotedPassages: quotes,
    paragraphCount: paras,
    seedScore,
    jitter,
    strengths: strengths.slice(0, 5),
    gaps: gaps.slice(0, 5),
  };
}

export function formatSignalsBlock(signals: ArticleScoreSignals): string {
  return [
    '=== DETERMINISTIC ARTICLE SIGNALS (seed the score — do not ignore) ===',
    `seedScore=${signals.seedScore} (jitter ${signals.jitter >= 0 ? '+' : ''}${signals.jitter})`,
    `words=${signals.wordCount} · entityish≈${signals.namedEntitiesApprox} · moneyMarks=${signals.moneyMentions} · dates=${signals.dateMentions}`,
    `attributionCues=${signals.attributionCues} · quotes=${signals.quotedPassages} · paragraphs=${signals.paragraphCount}`,
    signals.strengths.length ? `STRENGTHS: ${signals.strengths.join(' | ')}` : 'STRENGTHS: (none flagged)',
    signals.gaps.length ? `GAPS: ${signals.gaps.join(' | ')}` : 'GAPS: (none flagged)',
    'Your overall score MUST sit near seedScore (±12) unless live probes violently disagree — then explain why in axis notes.',
  ].join('\n');
}

/** Blend council + probes + deterministic seed — more arbitrary, still band-clamped. */
export function blendThreeWayScore(
  council: number,
  probe: number,
  seed: number
): number {
  // Probes and seed dominate so soft LLM midpoints cannot freeze the product
  const mixed = council * 0.28 + probe * 0.4 + seed * 0.32;
  return clampCiteScore(mixed);
}

export { CITE_SCORE_MIN, CITE_SCORE_MAX };

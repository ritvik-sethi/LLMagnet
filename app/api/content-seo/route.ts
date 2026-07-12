import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';
import {
  classifyEditorialContent,
  clampCiteScore,
  INVALID_INPUT_MESSAGE,
  CITE_SCORE_MIN,
  CITE_SCORE_MAX,
} from '../_shared/articleGate';
import { blendCiteabilityScore, runCitationProbes } from '../_shared/citationProbe';

export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    const { content, metaTitle } = await request.json();
    const title = ((metaTitle as string) || '').trim();
    const article = ((content as string) || '').trim();

    const gate = await classifyEditorialContent(title, article);
    if (!gate.ok) {
      console.warn('[content-seo] gate rejected', {
        code: gate.code,
        kind: gate.kind,
        message: gate.message,
        headlineLen: title.length,
        bodyChars: article.length,
        bodyWords: article.trim().split(/\s+/).filter(Boolean).length,
      });
      return NextResponse.json(
        { error: gate.message, code: gate.code, kind: gate.kind },
        { status: 400 }
      );
    }

    // Live probes: would OpenAI / Gemini actually cite this draft?
    const probes = await runCitationProbes(title, article);

    if (probes.rejectedAsInvalid) {
      console.warn('[content-seo] probe rejected as invalid input', {
        openai: probes.openai.error || probes.openai.notes,
        gemini: probes.gemini.error || probes.gemini.notes,
      });
      return NextResponse.json(
        {
          error: INVALID_INPUT_MESSAGE,
          code: 'GIBBERISH',
          citationProbes: {
            openai: probes.openai,
            gemini: probes.gemini,
            blendedProbeScore: probes.blendedScore,
          },
        },
        { status: 400 }
      );
    }

    const result = await runCouncil({
      tool: 'content-seo',
      content: `Headline: ${title}

Article:
${article}

${probes.evidenceBlock}

SCORING RULES (non-negotiable):
- Final overall "score" MUST be between ${CITE_SCORE_MIN} and ${CITE_SCORE_MAX} inclusive.
- Weight the OpenAI and Gemini probe notes heavily — do not default to a stuck midpoint.
- If probes say thin/missing attribution, score toward ${CITE_SCORE_MIN}–68. If dense & quotable, 74–${CITE_SCORE_MAX}.
- Use editorial judgment (slightly arbitrary within the band is fine). Stay polite while critically useful.
- Matrix axis maxes MUST sum to 100. Axis scores MUST sum exactly to the overall score.
- Matrix axis scores must track that overall band; notes must cite probe evidence or draft quotes.
- Ground notes in E-E-A-T Trust + LLM cite signals (quotable claims, entities, extractability, headline–query fit).`,
    });

    const councilScore =
      typeof result.score === 'number' ? result.score : probes.blendedScore;
    const finalScore = blendCiteabilityScore(councilScore, probes.blendedScore);
    const displayScore = clampCiteScore(finalScore);

    // Axis maxes already total 100; reshape scores so they SUM EXACTLY to displayScore
    let shaped = reconcileBreakdownToScore(result.breakdown || [], displayScore);

    return NextResponse.json({
      ...result,
      score: displayScore,
      breakdown: shaped,
      scoreBand: { min: CITE_SCORE_MIN, max: CITE_SCORE_MAX },
      citationProbes: {
        openai: probes.openai,
        gemini: probes.gemini,
        blendedProbeScore: probes.blendedScore,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in content SEO analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze content' }, { status: 500 });
  }
}

/** Scale matrix so axis maxes total 100 and axis scores total exactly `targetScore`. */
function reconcileBreakdownToScore(
  breakdown: { id: string; label: string; max: number; score: number; note: string }[],
  targetScore: number
) {
  if (!breakdown.length) return breakdown;

  const maxSum = breakdown.reduce((a, b) => a + (Number(b.max) || 0), 0) || 100;
  // Normalize maxes to sum to 100 (preserve relative weights)
  const withMax = breakdown.map((b) => {
    const max = Number(b.max) || 0;
    const normalizedMax =
      maxSum === 100 ? max : Math.max(1, Math.round((max / maxSum) * 100));
    return { ...b, max: normalizedMax, score: Number(b.score) || 0 };
  });

  // Fix max rounding drift to exact 100
  let maxDrift = 100 - withMax.reduce((a, b) => a + b.max, 0);
  if (maxDrift !== 0) {
    const order = [...withMax.keys()].sort((i, j) => withMax[j].max - withMax[i].max);
    let k = 0;
    while (maxDrift !== 0 && order.length) {
      const i = order[k % order.length];
      const step = maxDrift > 0 ? 1 : -1;
      const next = withMax[i].max + step;
      if (next >= 1) {
        withMax[i].max = next;
        maxDrift -= step;
      }
      k++;
      if (k > order.length * 20) break;
    }
  }

  const rawSum = withMax.reduce((a, b) => a + b.score, 0);
  if (rawSum <= 0) {
    // Distribute target evenly by max weight
    return withMax.map((b) => ({
      ...b,
      score: Math.min(b.max, Math.round((b.max / 100) * targetScore)),
    }));
  }

  const factor = targetScore / rawSum;
  const scaled = withMax.map((b) => {
    const next = Math.round(b.score * factor);
    return { ...b, score: Math.min(b.max, Math.max(0, next)) };
  });

  // Fix score rounding so sum === targetScore exactly
  let scoreDrift = targetScore - scaled.reduce((a, b) => a + b.score, 0);
  const order = [...scaled.keys()].sort((i, j) => scaled[j].max - scaled[i].max);
  let k = 0;
  while (scoreDrift !== 0 && order.length) {
    const i = order[k % order.length];
    const step = scoreDrift > 0 ? 1 : -1;
    const next = scaled[i].score + step;
    if (next >= 0 && next <= scaled[i].max) {
      scaled[i].score = next;
      scoreDrift -= step;
    }
    k++;
    if (k > order.length * 40) break;
  }

  return scaled;
}

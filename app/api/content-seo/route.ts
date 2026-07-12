import { NextResponse } from 'next/server';
import { runCouncil } from '../_shared/council';
import {
  classifyEditorialContent,
  clampCiteScore,
  INVALID_INPUT_MESSAGE,
  CITE_SCORE_MIN,
  CITE_SCORE_MAX,
} from '../_shared/articleGate';
import { runCitationProbes } from '../_shared/citationProbe';
import {
  blendThreeWayScore,
  computeArticleScoreSignals,
  formatSignalsBlock,
} from '../_shared/scoreSignals';

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

    const signals = computeArticleScoreSignals(title, article);
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
          scoreSignals: signals,
        },
        { status: 400 }
      );
    }

    const result = await runCouncil({
      tool: 'content-seo',
      content: `Headline: ${title}

Article:
${article}

${formatSignalsBlock(signals)}

${probes.evidenceBlock}

SCORING RULES (non-negotiable):
- Final overall "score" MUST be between ${CITE_SCORE_MIN} and ${CITE_SCORE_MAX} inclusive.
- Start from seedScore=${signals.seedScore}; move toward probe evidence (±12 unless probes violently disagree — then say why in notes).
- Different articles must not share the same score. Never land on round midpoints.
- Weight probes + seed heavily — do not invent a soft midpoint.
- Thin / unsourced → toward ${CITE_SCORE_MIN}–55. Dense & quotable → 78–${CITE_SCORE_MAX}.
- Matrix axis maxes MUST sum to 100. Axis scores MUST sum exactly to the overall score.
- Each axis note: Quote: «…» · Issue: … · Fix: …
- citeLedger is required: entities + claimAudits + deskMoves — this is the product backbone, not optional colour.`,
    });

    const councilScore =
      typeof result.score === 'number' ? result.score : probes.blendedScore;
    const finalScore = blendThreeWayScore(
      councilScore,
      probes.blendedScore,
      signals.seedScore
    );
    const displayScore = clampCiteScore(finalScore);

    const shaped = reconcileBreakdownToScore(result.breakdown || [], displayScore);

    return NextResponse.json({
      ...result,
      score: displayScore,
      breakdown: shaped,
      scoreBand: { min: CITE_SCORE_MIN, max: CITE_SCORE_MAX },
      scoreSignals: signals,
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
  const withMax = breakdown.map((b) => {
    const max = Number(b.max) || 0;
    const normalizedMax =
      maxSum === 100 ? max : Math.max(1, Math.round((max / maxSum) * 100));
    return { ...b, max: normalizedMax, score: Number(b.score) || 0 };
  });

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

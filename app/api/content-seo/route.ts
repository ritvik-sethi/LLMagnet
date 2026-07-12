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
- Matrix axis scores must track that overall band; notes must cite probe evidence or draft quotes.
- Ground notes in E-E-A-T Trust + LLM cite signals (quotable claims, entities, extractability, headline–query fit).`,
    });

    const councilScore =
      typeof result.score === 'number' ? result.score : probes.blendedScore;
    const finalScore = blendCiteabilityScore(councilScore, probes.blendedScore);

    // Prefer council's relative shape: normalize axis totals toward finalScore
    let shaped = result.breakdown || [];
    if ((result.breakdown || []).length > 0) {
      const rawSum = (result.breakdown || []).reduce((a, b) => a + (Number(b.score) || 0), 0);
      const maxSum = (result.breakdown || []).reduce((a, b) => a + (Number(b.max) || 0), 0) || 100;
      if (rawSum > 0) {
        const targetSum = Math.round((finalScore / 100) * maxSum);
        const factor = targetSum / rawSum;
        shaped = (result.breakdown || []).map((b) => {
          const max = Number(b.max) || 0;
          const next = Math.round((Number(b.score) || 0) * factor);
          return { ...b, score: Math.min(max, Math.max(0, next)) };
        });
      }
    }

    return NextResponse.json({
      ...result,
      score: clampCiteScore(finalScore),
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

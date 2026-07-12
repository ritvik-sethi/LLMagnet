'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaBrain, FaArrowRight } from 'react-icons/fa';
import styles from '@/styles/ContentScore.module.scss';
import CouncilVerdict, { CouncilResultView, CouncilStatus } from '@/components/CouncilVerdict';
import WowNote from '@/components/WowNote';
import {
  setDraftHeading,
  setDraftBody,
  setContentScore,
  setCurrentStage,
  markStageComplete,
  stagePath,
  lockStartedFrom,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

interface ProbeSide {
  provider: string;
  score: number;
  wouldCite: boolean;
  notes: string;
  claimsItWouldQuote: string[];
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

interface ScoreResult extends CouncilResultView {
  citationProbes?: {
    openai: ProbeSide;
    gemini: ProbeSide;
    blendedProbeScore: number;
  };
}

export default function ContentScore() {
  const dispatch = useDispatch();
  const router = useRouter();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);
  const citabilityScore = useSelector((s: RootState) => s.editorialDraft.citabilityScore);

  const [status, setStatus] = useState<CouncilStatus>('idle');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    dispatch(setCurrentStage('score'));
  }, [dispatch]);

  const handleEvaluate = async () => {
    dispatch(lockStartedFrom());
    setStatus('loading');
    setErrorMsg('');
    try {
      const response = await fetch('/api/content-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metaTitle: heading, content: body }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(
          (data && data.error) ||
            'ENTER A VALID PROMPT LINK — this tool only scores real news articles.'
        );
        setResult(null);
        setStatus('error');
        return;
      }
      setResult(data as ScoreResult);
      if (typeof data.score === 'number') dispatch(setContentScore(data.score));
      dispatch(markStageComplete('score'));
      setStatus('success');
    } catch {
      setErrorMsg('Could not score this draft. Try again in a moment.');
      setStatus('error');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className="desk-kicker" style={{ textAlign: 'left' }}>
          Step 2 of 6 · Score citeability
        </p>
        <h1 className={styles.title}>
          <FaBrain className={styles.icon} />
          Score citeability
        </h1>
        <p className={styles.subtitle}>
          Live OpenAI citation probe + editor matrix. We can judge Gemini, Grok, Meta AI, and
          Perplexity the same way — this demo just doesn’t have those keys wired in yet.
        </p>
      </header>

      <WowNote label="Demo">
        OpenAI is live in this build. We can run the same citeability judgment for{' '}
        <strong>Gemini, Grok, Meta AI, and Perplexity</strong> too — we simply haven’t purchased those
        API keys for this demo.
      </WowNote>

      <div className={styles.composer}>
        <label className={styles.composerLabel} htmlFor="score-title">
          Headline
        </label>
        <input
          id="score-title"
          type="text"
          className={styles.composerTitle}
          value={heading}
          onChange={(e) => dispatch(setDraftHeading(e.target.value))}
          placeholder="Article headline"
        />
        <div className={styles.composerRule} aria-hidden />
        <label className={styles.composerLabel} htmlFor="content-editor">
          Article
        </label>
        <textarea
          id="content-editor"
          className={styles.composerBody}
          value={body}
          onChange={(e) => dispatch(setDraftBody(e.target.value))}
          placeholder="Paste the full news or business article…"
          rows={12}
        />
        <div className={styles.composerFooter}>
          <span className={styles.composerMeta}>
            {body.trim()
              ? `${body.trim().split(/\s+/).length} words`
              : 'Draft carries across all stages'}
          </span>
          <button
            className={styles.evaluateButton}
            onClick={handleEvaluate}
            disabled={!body.trim() || heading.trim().length < 8 || status === 'loading'}
          >
            {status === 'loading' ? (
              <>
                <span className={styles.btnSpinner} aria-hidden />
                Scoring…
              </>
            ) : (
              <>
                Score article
                <FaArrowRight aria-hidden />
              </>
            )}
          </button>
        </div>
      </div>

      {body.trim() && heading.trim().length < 8 && (
        <p className={styles.fieldHint}>
          Add a news headline before scoring — untitled pastes are rejected.
        </p>
      )}

      {errorMsg && (
        <div className={styles.errorBanner} role="alert">
          {errorMsg}
        </div>
      )}

      {status === 'success' && citabilityScore !== null && (
        <section className={styles.overallScoreSection}>
          <h2 className={styles.sectionTitle}>
            <FaBrain className={styles.icon} />
            Your citeability score
          </h2>
          <div className={styles.overallScoreDisplay}>
            <div
              className={styles.scoreCircle}
              style={{ '--score': `${citabilityScore}%` } as React.CSSProperties}
            >
              <div className={styles.scoreValue}>{citabilityScore}</div>
            </div>
            <div className={styles.scoreInfo}>
              <div className={styles.scoreLabel}>
                Scored from live OpenAI citation probe
              </div>
            </div>
          </div>
        </section>
      )}

      {status === 'success' && (
        <section className={styles.probePanel}>
          <h3 className={styles.probeTitle}>Live citation probe</h3>
          <p className={styles.probeLede}>
            OpenAI is running live in this demo. Claude is out of scope — it rarely cites sources.
          </p>

          {result?.citationProbes?.openai && !result.citationProbes.openai.skipped && (
            <div className={styles.probeRow}>
              <div className={styles.probeRowHead}>
                <strong>OpenAI</strong>
                <span className={styles.badgeLive}>Live in demo</span>
                <span className={styles.probeMeta}>
                  {result.citationProbes.openai.ok
                    ? `score ${result.citationProbes.openai.score} · would cite: ${
                        result.citationProbes.openai.wouldCite ? 'yes' : 'leaning no'
                      }`
                    : 'probe unavailable'}
                  {result.citationProbes.openai.error
                    ? ` · ${result.citationProbes.openai.error}`
                    : ''}
                </span>
              </div>
              {result.citationProbes.openai.notes && (
                <p className={styles.probeNotes}>{result.citationProbes.openai.notes}</p>
              )}
              {result.citationProbes.openai.claimsItWouldQuote?.length > 0 && (
                <ul className={styles.probeClaims}>
                  {result.citationProbes.openai.claimsItWouldQuote.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className={styles.demoEngines}>
            <div className={styles.demoEnginesHead}>
              <h4>Other answer engines we can judge</h4>
              <p>
                Same citeability check works for these too. For this demo we haven’t purchased API
                keys yet, so they’re shown as available capability — not live results.
              </p>
            </div>

            <div className={styles.lockedGrid}>
              {(
                [
                  {
                    id: 'gemini',
                    label: 'Gemini',
                    blurb: 'We can judge whether Google’s answer engine would cite this draft.',
                  },
                  {
                    id: 'grok',
                    label: 'Grok',
                    blurb: 'We can judge whether Grok / X answers would surface this story.',
                  },
                  {
                    id: 'meta',
                    label: 'Meta AI',
                    blurb: 'We can judge extractable claims for Meta AI / Llama retrieval.',
                  },
                  {
                    id: 'perplexity',
                    label: 'Perplexity',
                    blurb: 'We can judge whether Perplexity would link this piece in an answer.',
                  },
                ] as const
              ).map((engine) => (
                <div key={engine.id} className={styles.demoCard}>
                  <div className={styles.probeRowHead}>
                    <strong>{engine.label}</strong>
                    <span className={styles.badgeDemo}>Demo · no key yet</span>
                  </div>
                  <p className={styles.probeSoonBlurb}>{engine.blurb}</p>
                  <p className={styles.lockedHint}>Capable — key not purchased for this demo</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict
          status={status === 'error' && errorMsg ? 'idle' : status}
          result={result}
          onRetry={handleEvaluate}
          loadingFlow="score"
          idleHint={
            errorMsg
              ? 'Fix the paste above, then score again.'
              : 'Score the draft to run the live OpenAI probe. Gemini, Grok, Meta, and Perplexity can be judged the same way once demo keys are available.'
          }
        />
      </div>

      {status === 'success' && (
        <button
          className={styles.evaluateButton}
          style={{ marginTop: '1.25rem' }}
          onClick={() => {
            dispatch(setCurrentStage('live'));
            router.push(stagePath('live'));
          }}
        >
          <FaArrowRight /> Next: Check what’s live on Google &amp; X
        </button>
      )}
    </div>
  );
}

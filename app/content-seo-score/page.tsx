'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaBrain, FaFileAlt, FaRocket, FaArrowRight } from 'react-icons/fa';
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
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

interface ProbeSide {
  provider: string;
  score: number;
  wouldCite: boolean;
  notes: string;
  claimsItWouldQuote: string[];
  ok: boolean;
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
            'ENTER A VALID PROMPT LINK — this desk only scores real news articles.'
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
          Step 2 of 6 · How citeable is this?
        </p>
        <h1 className={styles.title}>
          <FaBrain className={styles.icon} />
          Score your news article for AI citations
        </h1>
        <p className={styles.subtitle}>
          We ask OpenAI and Gemini whether they would cite this piece, then score between 60 and 85 —
          grounded in E-E-A-T trust signals and real LLM citation research. News articles only.
        </p>
      </header>

      <WowNote label="Wow">
        Score moves with <strong>live OpenAI + Gemini citation probes</strong> and a deep desk
        matrix — not a stuck middle number. Gibberish, Wikipedia dumps, and social posts get{' '}
        <strong>ENTER A VALID PROMPT LINK</strong> instead of a fake score.
      </WowNote>

      <div className={styles.inputContainer}>
        <div className={styles.headingInput}>
          <label className={styles.headingLabel}>
            <FaFileAlt className={styles.icon} />
            Article Title
          </label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.headingField}
              value={heading}
              onChange={(e) => dispatch(setDraftHeading(e.target.value))}
              placeholder="e.g. Zepto raises $665M as quick-commerce heats up in India"
            />
          </div>
        </div>

        <div className={styles.editor}>
          <textarea
            id="content-editor"
            className={styles.textArea}
            value={body}
            onChange={(e) => dispatch(setDraftBody(e.target.value))}
            placeholder="Paste a full news / business article draft…"
          />
        </div>
      </div>

      <button
        className={styles.evaluateButton}
        onClick={handleEvaluate}
        disabled={!body.trim() || heading.trim().length < 8 || status === 'loading'}
      >
        <FaRocket className={styles.icon} />
        {status === 'loading' ? 'Probing OpenAI & Gemini…' : 'Score this draft'}
      </button>

      {body.trim() && heading.trim().length < 8 && (
        <p style={{ marginTop: '0.6rem', color: '#991b1b', fontSize: '0.9rem' }}>
          Add a news headline (a few words) before scoring — untitled pastes are rejected.
        </p>
      )}

      {errorMsg && (
        <div
          role="alert"
          style={{
            marginTop: '1rem',
            padding: '0.9rem 1.1rem',
            border: '1px solid #fca5a5',
            background: '#fef2f2',
            color: '#991b1b',
            fontSize: '0.92rem',
            lineHeight: 1.45,
          }}
        >
          {errorMsg}
        </div>
      )}

      {status === 'success' && citabilityScore !== null && (
        <section className={styles.overallScoreSection}>
          <h2 className={styles.sectionTitle}>
            <FaBrain className={styles.icon} />
            Your citeability score (60–85)
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
                Blended from OpenAI + Gemini citation probes
              </div>
            </div>
          </div>
        </section>
      )}

      {status === 'success' && result?.citationProbes && (
        <section className="desk-panel" style={{ marginTop: '1rem' }}>
          <h3 style={{ margin: '0 0 0.65rem', fontSize: '1rem' }}>Live citation probes</h3>
          {(['openai', 'gemini'] as const).map((key) => {
            const p = result.citationProbes![key];
            return (
              <div key={key} style={{ marginBottom: '0.85rem' }}>
                <strong style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>
                  {p.provider}
                </strong>
                <span className="desk-meta">
                  {' '}
                  · {p.ok ? `score ${p.score}` : 'probe unavailable'}
                  {p.ok ? ` · would cite: ${p.wouldCite ? 'yes' : 'leaning no'}` : ''}
                  {p.error ? ` · ${p.error}` : ''}
                </span>
                {p.notes && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', lineHeight: 1.45 }}>
                    {p.notes}
                  </p>
                )}
                {p.claimsItWouldQuote?.length > 0 && (
                  <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', fontSize: '0.85rem' }}>
                    {p.claimsItWouldQuote.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict
          status={status === 'error' && errorMsg ? 'idle' : status}
          result={result}
          onRetry={handleEvaluate}
          idleHint={
            errorMsg
              ? 'Fix the paste above, then score again.'
              : 'Score the draft to probe OpenAI & Gemini and see both editors.'
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

'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaBrain, FaFileAlt, FaRocket } from 'react-icons/fa';
import styles from '@/styles/ContentScore.module.scss';
import CouncilVerdict, { CouncilResultView, CouncilStatus } from '@/components/CouncilVerdict';
import {
  setDraftHeading,
  setDraftBody,
  setContentScore,
  setCurrentStage,
  markStageComplete,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

export default function ContentScore() {
  const dispatch = useDispatch();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);
  const citabilityScore = useSelector((s: RootState) => s.editorialDraft.citabilityScore);

  const [status, setStatus] = useState<CouncilStatus>('idle');
  const [result, setResult] = useState<CouncilResultView | null>(null);

  useEffect(() => {
    dispatch(setCurrentStage('score'));
  }, [dispatch]);

  const handleEvaluate = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/content-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metaTitle: heading, content: body }),
      });
      if (!response.ok) throw new Error('Failed to analyze content');
      const data = (await response.json()) as CouncilResultView;
      setResult(data);
      if (typeof data.score === 'number') dispatch(setContentScore(data.score));
      dispatch(markStageComplete('score'));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <FaBrain className={styles.icon} />
          LLM Content SEO Analyzer
        </h1>
        <p className={styles.subtitle}>
          Score your article&apos;s LLM-citability and hear both voices of the council — for a newsroom
          covering Indian startups.
        </p>
      </header>

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
            placeholder="Paste or write your article here — e.g. a funding story or company profile..."
          />
        </div>
      </div>

      <button
        className={styles.evaluateButton}
        onClick={handleEvaluate}
        disabled={!body.trim() || status === 'loading'}
      >
        <FaRocket className={styles.icon} />
        {status === 'loading' ? 'Convening the council...' : 'Score & convene council'}
      </button>

      {status === 'success' && citabilityScore !== null && (
        <section className={styles.overallScoreSection}>
          <h2 className={styles.sectionTitle}>
            <FaBrain className={styles.icon} />
            Citability Score
          </h2>
          <div className={styles.overallScoreDisplay}>
            <div
              className={styles.scoreCircle}
              style={{ '--score': `${citabilityScore}%` } as React.CSSProperties}
            >
              <div className={styles.scoreValue}>{citabilityScore}</div>
            </div>
            <div className={styles.scoreInfo}>
              <div className={styles.scoreLabel}>Overall LLM Citability</div>
            </div>
          </div>
        </section>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict
          status={status}
          result={result}
          onRetry={handleEvaluate}
          idleHint="Score your article to hear from The Reader and The Machine."
        />
      </div>
    </div>
  );
}

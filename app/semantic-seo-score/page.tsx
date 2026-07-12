'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaBrain, FaCode, FaRocket, FaArrowRight } from 'react-icons/fa';
import styles from '@/styles/SemanticScore.module.scss';
import CouncilVerdict, { CouncilResultView, CouncilStatus } from '@/components/CouncilVerdict';
import {
  setDraftHeading,
  setDraftBody,
  setSemanticScore,
  setCurrentStage,
  markStageComplete,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

export default function SemanticScore() {
  const dispatch = useDispatch();
  const router = useRouter();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);
  const citabilityScore = useSelector((s: RootState) => s.editorialDraft.citabilityScore);

  const [status, setStatus] = useState<CouncilStatus>('idle');
  const [result, setResult] = useState<CouncilResultView | null>(null);

  useEffect(() => {
    dispatch(setCurrentStage('score'));
  }, [dispatch]);

  const handleAnalyze = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/semantic-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metaTitle: heading, content: body }),
      });
      if (!response.ok) throw new Error('Failed to analyze content');
      const data = (await response.json()) as CouncilResultView;
      setResult(data);
      if (typeof data.score === 'number') dispatch(setSemanticScore(data.score));
      dispatch(markStageComplete('score'));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <FaCode className={styles.titleIcon} />
            <div>
              <h1 className={styles.title}>Semantic SEO Analyzer</h1>
              <p className={styles.subtitle}>
                Judge how well your article maps to what AI search understands — with both council voices.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.codeEditorSection}>
        <div className={styles.codeEditorCard}>
          <div className={styles.editorHeader}>
            <h2 className={styles.sectionTitle}>
              <FaCode className={styles.icon} />
              Your Article
            </h2>
          </div>

          <input
            type="text"
            value={heading}
            onChange={(e) => dispatch(setDraftHeading(e.target.value))}
            placeholder="Article title..."
            style={{ width: '100%', padding: '0.6rem', marginBottom: '0.75rem' }}
          />
          <div className={styles.codeEditorContainer}>
            <textarea
              id="semantic-editor"
              value={body}
              onChange={(e) => dispatch(setDraftBody(e.target.value))}
              placeholder="Paste your article here for semantic analysis..."
              className={styles.codeEditor}
              rows={12}
              aria-label="Article editor for semantic analysis"
            />
          </div>

          <button
            className={styles.analyzeButton}
            onClick={handleAnalyze}
            disabled={status === 'loading' || !body.trim()}
          >
            <FaBrain />
            {status === 'loading' ? 'Convening the council...' : 'Score & convene council'}
          </button>
        </div>
      </section>

      {status === 'success' && citabilityScore !== null && (
        <section className={styles.scoreSection}>
          <div className={styles.scoreCard}>
            <h2 className={styles.sectionTitle}>
              <FaBrain className={styles.icon} />
              Citability Score
            </h2>
            <div className={styles.scoreDisplay}>
              <div className={styles.scoreCircle}>
                <div className={styles.scoreValue}>{citabilityScore}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict
          status={status}
          result={result}
          onRetry={handleAnalyze}
          idleHint="Score your article to hear from The Reader and The Machine."
        />
      </div>

      {status === 'success' && (
        <section className={styles.rewriteSection} style={{ marginTop: '1.5rem' }}>
          <button
            className={styles.rewriteButton}
            onClick={() => {
              dispatch(setCurrentStage('rewrite'));
              router.push('/rewrite-for-llm');
            }}
          >
            <FaArrowRight />
            Send to Rewrite
          </button>
        </section>
      )}
    </div>
  );
}

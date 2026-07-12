'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaPenFancy, FaRocket, FaArrowRight } from 'react-icons/fa';
import CouncilVerdict, { CouncilResultView, CouncilStatus } from '@/components/CouncilVerdict';
import {
  setDraftHeading,
  setDraftBody,
  setCurrentStage,
  markStageComplete,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

export default function RewriteForLLM() {
  const dispatch = useDispatch();
  const router = useRouter();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);

  const [status, setStatus] = useState<CouncilStatus>('idle');
  const [result, setResult] = useState<CouncilResultView | null>(null);

  useEffect(() => {
    dispatch(setCurrentStage('rewrite'));
  }, [dispatch]);

  const run = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/rewrite-for-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading, content: body }),
      });
      if (!res.ok) throw new Error('failed');
      setResult((await res.json()) as CouncilResultView);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const applyRewrite = () => {
    if (result?.rewrittenContent) {
      dispatch(setDraftBody(result.rewrittenContent));
      dispatch(markStageComplete('rewrite'));
      dispatch(setCurrentStage('rescore'));
      router.push('/content-seo-score');
    }
  };

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FaPenFancy /> Rewrite Tool
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>
        Rewrite for citations without losing the human read — then re-score to watch it climb.
      </p>

      <input
        type="text"
        value={heading}
        onChange={(e) => dispatch(setDraftHeading(e.target.value))}
        placeholder="Article title..."
        style={{ width: '100%', padding: '0.6rem', marginBottom: '0.75rem' }}
      />
      <textarea
        value={body}
        onChange={(e) => dispatch(setDraftBody(e.target.value))}
        placeholder="Your draft (carried over from the pipeline)..."
        rows={10}
        style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem' }}
      />
      <button className="ce-primary-btn" onClick={run} disabled={status === 'loading' || !body.trim()}>
        <FaRocket /> {status === 'loading' ? 'Convening the council...' : 'Rewrite & convene council'}
      </button>

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict status={status} result={result} onRetry={run} idleHint="Run a rewrite to hear from The Reader and The Machine." />
      </div>

      {status === 'success' && result?.rewrittenContent && (
        <section style={{ marginTop: '1.5rem' }}>
          <h2>Proposed rewrite</h2>
          <div
            style={{
              whiteSpace: 'pre-wrap',
              background: '#f3f4f6',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {result.rewrittenContent}
          </div>
          <button className="ce-primary-btn" style={{ marginTop: '1rem' }} onClick={applyRewrite}>
            <FaArrowRight /> Apply rewrite &amp; re-score
          </button>
        </section>
      )}
    </main>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaBullseye, FaRocket, FaArrowRight } from 'react-icons/fa';
import CouncilVerdict, { CouncilResultView, CouncilStatus } from '@/components/CouncilVerdict';
import {
  setDraftHeading,
  setDraftBody,
  setCurrentStage,
  markStageComplete,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

export default function QueryOptimizer() {
  const dispatch = useDispatch();
  const router = useRouter();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);

  const [status, setStatus] = useState<CouncilStatus>('idle');
  const [result, setResult] = useState<CouncilResultView | null>(null);

  useEffect(() => {
    dispatch(setCurrentStage('suggest'));
  }, [dispatch]);

  const run = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/query-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metaTitle: heading, content: body }),
      });
      if (!res.ok) throw new Error('failed');
      setResult((await res.json()) as CouncilResultView);
      dispatch(markStageComplete('suggest'));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FaBullseye /> Query Optimizer
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>
        Find the questions this Indian-startup story should win citations for — then hear both
        editor views on which ones readers care about vs which ones AIs will cite.
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
        placeholder="Paste your article here..."
        rows={10}
        style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem' }}
      />
      <button className="ce-primary-btn" onClick={run} disabled={status === 'loading' || !body.trim()}>
        <FaRocket /> {status === 'loading' ? 'Mapping queries…' : 'Map target queries'}
      </button>

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict
          status={status}
          result={result}
          onRetry={run}
          loadingFlow="queries"
          idleHint="Run the optimizer to get target queries plus both editor views."
        />
      </div>

      {status === 'success' && (
        <button
          className="ce-primary-btn"
          style={{ marginTop: '1.5rem' }}
          onClick={() => {
            dispatch(setCurrentStage('rewrite'));
            router.push('/rewrite-for-llm');
          }}
        >
          <FaArrowRight /> Next: Rewrite for citability
        </button>
      )}
    </main>
  );
}

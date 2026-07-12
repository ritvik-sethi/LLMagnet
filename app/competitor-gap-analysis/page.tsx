'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaSearch, FaRocket, FaArrowRight } from 'react-icons/fa';
import CouncilVerdict, { CouncilResultView, CouncilStatus } from '@/components/CouncilVerdict';
import {
  setDraftBody,
  setCurrentStage,
  markStageComplete,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

export default function CompetitorGap() {
  const dispatch = useDispatch();
  const router = useRouter();
  const body = useSelector((s: RootState) => s.editorialDraft.body);

  const [competitor, setCompetitor] = useState('');
  const [status, setStatus] = useState<CouncilStatus>('idle');
  const [result, setResult] = useState<CouncilResultView | null>(null);

  useEffect(() => {
    dispatch(setCurrentStage('discover'));
  }, [dispatch]);

  const run = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/competitor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yourContent: body, competitorContent: competitor }),
      });
      if (!res.ok) throw new Error('failed');
      setResult((await res.json()) as CouncilResultView);
      dispatch(markStageComplete('discover'));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FaSearch /> Competitor Gap
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>
        See what rival coverage of this Indian-startup story has that yours doesn&apos;t — from both council voices.
      </p>

      <label style={{ fontWeight: 600 }}>Your article (from the shared draft)</label>
      <textarea
        value={body}
        onChange={(e) => dispatch(setDraftBody(e.target.value))}
        placeholder="Your article..."
        rows={8}
        style={{ width: '100%', padding: '0.6rem', margin: '0.4rem 0 1rem' }}
      />
      <label style={{ fontWeight: 600 }}>Competitor coverage (optional)</label>
      <textarea
        value={competitor}
        onChange={(e) => setCompetitor(e.target.value)}
        placeholder="Paste a competitor's article, or leave blank to infer typical coverage..."
        rows={6}
        style={{ width: '100%', padding: '0.6rem', margin: '0.4rem 0 1rem' }}
      />
      <button className="ce-primary-btn" onClick={run} disabled={status === 'loading' || !body.trim()}>
        <FaRocket /> {status === 'loading' ? 'Convening the council...' : 'Find the gaps'}
      </button>

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict status={status} result={result} onRetry={run} idleHint="Run the gap analysis to hear from The Reader and The Machine." />
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
          <FaArrowRight /> Close the gaps in Rewrite
        </button>
      )}
    </main>
  );
}

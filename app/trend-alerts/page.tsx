'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaChartLine, FaRocket, FaArrowRight } from 'react-icons/fa';
import CouncilVerdict, { CouncilResultView, CouncilStatus } from '@/components/CouncilVerdict';
import {
  setDraftHeading,
  setDraftBody,
  setCurrentStage,
  markStageComplete,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

export default function TrendAlerts() {
  const dispatch = useDispatch();
  const router = useRouter();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);

  const [status, setStatus] = useState<CouncilStatus>('idle');
  const [result, setResult] = useState<CouncilResultView | null>(null);

  useEffect(() => {
    dispatch(setCurrentStage('live'));
  }, [dispatch]);

  const run = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/trend-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading, content: body }),
      });
      if (!res.ok) throw new Error('failed');
      setResult((await res.json()) as CouncilResultView);
      dispatch(markStageComplete('live'));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FaChartLine /> Trend Alerts
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>
        Surface angles a newsroom covering Indian startups should pursue now — Human Edge for the
        story hook, SEO Specialist for what AIs will cite this week.
      </p>

      <input
        type="text"
        value={heading}
        onChange={(e) => dispatch(setDraftHeading(e.target.value))}
        placeholder="Working headline (e.g. India fintech funding rebounds)..."
        style={{ width: '100%', padding: '0.6rem', marginBottom: '0.75rem' }}
      />
      <textarea
        value={body}
        onChange={(e) => dispatch(setDraftBody(e.target.value))}
        placeholder="Optional: paste an early draft, or leave blank to start from a trend..."
        rows={8}
        style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem' }}
      />
      <button
        className="ce-primary-btn"
        onClick={run}
        disabled={status === 'loading' || (!heading.trim() && !body.trim())}
      >
        <FaRocket /> {status === 'loading' ? 'Scanning angles…' : 'Find trending angles'}
      </button>

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict
          status={status}
          result={result}
          onRetry={run}
          idleHint="Run Trends to get angles plus both desk views."
        />
      </div>

      {status === 'success' && (
        <button
          className="ce-primary-btn"
          style={{ marginTop: '1.5rem' }}
          onClick={() => {
            dispatch(setCurrentStage('score'));
            router.push('/content-seo-score');
          }}
        >
          <FaArrowRight /> Next: Score this draft
        </button>
      )}
    </main>
  );
}

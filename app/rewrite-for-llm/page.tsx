'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaPenFancy, FaRocket, FaArrowRight, FaExternalLinkAlt } from 'react-icons/fa';
import CouncilVerdict, { CouncilResultView, CouncilStatus } from '@/components/CouncilVerdict';
import WowNote from '@/components/WowNote';
import {
  setDraftHeading,
  setDraftBody,
  applyRewrittenBody,
  setCurrentStage,
  markStageComplete,
  stagePath,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

interface ClaimResearchRow {
  claim: string;
  searchQuery: string;
  hitCount: number;
  topSources: { title: string; url: string; site: string; engine: string }[];
}

interface WebRef {
  title: string;
  url: string;
  site?: string;
  engine?: string;
}

interface RewriteResult extends CouncilResultView {
  rewrittenContent?: string;
  additions?: string[];
  claimResearch?: ClaimResearchRow[];
  webSources?: {
    providerNote: string;
    references: WebRef[];
    scraped: { url: string; title: string; ok: boolean; site: string; error?: string }[];
  };
}

export default function RewriteForLLM() {
  const dispatch = useDispatch();
  const router = useRouter();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);

  const [status, setStatus] = useState<CouncilStatus>('idle');
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [phase, setPhase] = useState('');

  useEffect(() => {
    dispatch(setCurrentStage('rewrite'));
  }, [dispatch]);

  const run = async () => {
    setStatus('loading');
    setPhase('Pulling claims from your draft…');
    const t1 = setTimeout(() => setPhase('Searching the web for each claim…'), 3500);
    const t2 = setTimeout(() => setPhase('Reading sources & densifying the piece…'), 10000);
    const t3 = setTimeout(() => setPhase('Indian business desk polish…'), 18000);
    try {
      const res = await fetch('/api/rewrite-for-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading, content: body }),
      });
      if (!res.ok) throw new Error('failed');
      setResult((await res.json()) as RewriteResult);
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setPhase('');
    }
  };

  const applyRewrite = () => {
    if (result?.rewrittenContent) {
      dispatch(applyRewrittenBody(result.rewrittenContent));
      dispatch(markStageComplete('rewrite'));
      dispatch(setCurrentStage('competitors'));
      router.push(stagePath('competitors'));
    }
  };

  return (
    <main className="desk-page">
      <p className="desk-kicker">Step 5 of 6 · Polish the copy</p>
      <h1 className="desk-title">
        <FaPenFancy /> Indian business desk polish
      </h1>
      <p className="desk-lede">
        A senior Indian business newsroom editor verifies your claims on the web, then rewrites for
        denser facts, sharper framing, and careful market speculation — without labelling opinions
        in the copy.
      </p>

      <WowNote label="Wow">
        <strong>Claim → Google → fuller rewrite</strong> under an Indian business-desk voice. Clean
        polished article; at the end, a plain list of what was added.
      </WowNote>

      <label className="desk-label">Headline</label>
      <input
        className="desk-field"
        type="text"
        value={heading}
        onChange={(e) => dispatch(setDraftHeading(e.target.value))}
        placeholder="Article title…"
      />
      <label className="desk-label">Article body</label>
      <textarea
        className="desk-field"
        value={body}
        onChange={(e) => dispatch(setDraftBody(e.target.value))}
        placeholder="Your working draft…"
        rows={8}
      />

      <button
        className="ce-primary-btn"
        onClick={run}
        disabled={status === 'loading' || !body.trim()}
      >
        <FaRocket />{' '}
        {status === 'loading' ? phase || 'Working…' : 'Research claims & polish'}
      </button>
      {status === 'loading' && (
        <p className="desk-meta" style={{ marginTop: 10 }}>
          This takes longer on purpose — we verify claims one by one before the full rewrite.
        </p>
      )}

      {status === 'success' && result?.claimResearch && result.claimResearch.length > 0 && (
        <section className="desk-panel" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.65rem', fontSize: '1rem' }}>
            Claims we pulled &amp; searched ({result.claimResearch.length})
          </h3>
          <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {result.claimResearch.map((c, i) => (
              <li key={i} style={{ marginBottom: '0.85rem' }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>{c.claim}</strong>
                <span className="desk-meta">
                  Searched: “{c.searchQuery}” · {c.hitCount} hits
                </span>
                {c.topSources.length > 0 && (
                  <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1rem', fontSize: '0.85rem' }}>
                    {c.topSources.map((s, j) => (
                      <li key={j}>
                        {s.engine} · {s.site} —{' '}
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.title || s.url} <FaExternalLinkAlt style={{ fontSize: '0.65rem' }} />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {status === 'success' && result?.webSources && (
        <section className="desk-panel">
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Sources behind the polish</h3>
          <p className="desk-meta" style={{ marginBottom: '0.75rem' }}>
            Via {result.webSources.providerNote}
          </p>
          {result.webSources.scraped.filter((s) => s.ok).length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ fontSize: '0.85rem' }}>Articles read in full:</strong>
              <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', fontSize: '0.88rem' }}>
                {result.webSources.scraped
                  .filter((s) => s.ok)
                  .map((s, i) => (
                    <li key={i}>
                      {s.site} —{' '}
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.title || s.url}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {status === 'success' && result?.rewrittenContent && (
        <section className="desk-panel" style={{ marginTop: '1.5rem' }}>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem' }}>Polished article</h2>
          <div
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.65,
              fontSize: '0.95rem',
              color: '#18181b',
            }}
          >
            {result.rewrittenContent}
          </div>

          {(result.additions?.length ?? 0) > 0 && (
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <h3 style={{ margin: '0 0 0.55rem', fontSize: '1rem' }}>What we added</h3>
              <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
                {result.additions!.map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.35rem' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict
          status={status}
          result={result}
          onRetry={run}
          idleHint="Research claims on the web, then get a full Indian business-desk rewrite."
        />
      </div>

      {status === 'success' && result?.rewrittenContent && (
        <button className="ce-primary-btn" style={{ marginTop: '1rem' }} onClick={applyRewrite}>
          <FaArrowRight /> Accept polish &amp; check rivals
        </button>
      )}
    </main>
  );
}

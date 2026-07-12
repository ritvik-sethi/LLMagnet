'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaSearch, FaRocket, FaExternalLinkAlt } from 'react-icons/fa';
import CouncilVerdict, { CouncilResultView, CouncilStatus } from '@/components/CouncilVerdict';
import WowNote from '@/components/WowNote';
import {
  setDraftHeading,
  setDraftBody,
  setCurrentStage,
  markStageComplete,
  lockStartedFrom,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

interface ScrapedRow {
  url: string;
  title: string;
  ok: boolean;
  error?: string;
  site?: string;
  excerpt: string;
}

interface DiscoveryHit {
  title: string;
  url: string;
  site: string;
  engine: string;
  snippet: string;
}

interface CompetitorResult extends CouncilResultView {
  scraped?: ScrapedRow[];
  excludedSites?: string[];
  searchPlan?: {
    googleSearches: string[];
    llmSearches: string[];
  };
  discoveryHits?: DiscoveryHit[];
  providerNote?: string;
}

export default function CompetitorGap() {
  const dispatch = useDispatch();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);
  const sourceUrl = useSelector((s: RootState) => s.editorialDraft.sourceUrl);
  const score = useSelector((s: RootState) => s.editorialDraft.citabilityScore);
  const liveCheck = useSelector((s: RootState) => s.editorialDraft.liveCheck);
  const advice = useSelector((s: RootState) => s.editorialDraft.advice);

  const [extraUrls, setExtraUrls] = useState('');
  const [status, setStatus] = useState<CouncilStatus>('idle');
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [phase, setPhase] = useState('');

  useEffect(() => {
    dispatch(setCurrentStage('competitors'));
  }, [dispatch]);

  const run = async () => {
    dispatch(lockStartedFrom());
    setStatus('loading');
    setPhase('Reverse-engineering Google & LLM searches…');
    const t1 = setTimeout(() => setPhase('Searching rival coverage (excluding your source site)…'), 4000);
    const t2 = setTimeout(() => setPhase('Reading rival articles in depth…'), 12000);
    const t3 = setTimeout(() => setPhase('Digging gaps vs your draft…'), 22000);
    try {
      const competitorUrls = extraUrls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);
      const res = await fetch('/api/competitor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heading,
          content: body,
          competitorUrls,
          sourceUrl,
          score,
          liveCheck,
          advice,
        }),
      });
      if (!res.ok) throw new Error('failed');
      setResult((await res.json()) as CompetitorResult);
      dispatch(markStageComplete('competitors'));
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

  return (
    <main className="desk-page">
      <p className="desk-kicker">Step 6 of 6 · Compare rival coverage</p>
      <h1 className="desk-title">
        <FaSearch /> Compare rival coverage
      </h1>
      <p className="desk-lede">
        We reverse-engineer your piece into Google and LLM-style searches, find coverage from other
        outlets (never your source site), read those articles, then dig into how your draft holds up.
      </p>

      <WowNote label="Wow">
        Same-site results are excluded. Walk away with a <strong>gap list you can assign</strong>{' '}
        after reading real rival pages.
      </WowNote>

      {sourceUrl && (
        <p className="desk-meta" style={{ marginBottom: '0.75rem' }}>
          Source draft loaded from: {sourceUrl} — that site will not be treated as a rival.
        </p>
      )}

      <label className="desk-label">Headline</label>
      <input
        className="desk-field"
        type="text"
        value={heading}
        onChange={(e) => dispatch(setDraftHeading(e.target.value))}
        placeholder="Headline"
      />
      <label className="desk-label">Your article</label>
      <textarea
        className="desk-field"
        value={body}
        onChange={(e) => dispatch(setDraftBody(e.target.value))}
        placeholder="Your working draft…"
        rows={8}
      />

      <label className="desk-label">Rival URLs (optional — one per line)</label>
      <textarea
        className="desk-field"
        value={extraUrls}
        onChange={(e) => setExtraUrls(e.target.value)}
        placeholder="Leave blank to discover rivals via reverse-engineered searches, or paste specific URLs from other sites…"
        rows={3}
      />

      <button className="ce-primary-btn" onClick={run} disabled={status === 'loading' || !body.trim()}>
        <FaRocket />{' '}
        {status === 'loading' ? phase || 'Working…' : 'Find rivals & gaps'}
      </button>

      {status === 'success' && result?.excludedSites && result.excludedSites.length > 0 && (
        <p className="desk-meta" style={{ marginTop: '1rem' }}>
          Excluded as source site(s): {result.excludedSites.join(', ')}
        </p>
      )}

      {status === 'success' && result?.searchPlan && (
        <section className="desk-panel" style={{ marginTop: '1rem' }}>
          <h3 style={{ margin: '0 0 0.65rem', fontSize: '1rem' }}>Searches we ran</h3>
          <p className="desk-meta" style={{ marginBottom: '0.5rem' }}>
            Via {result.providerNote || 'web search'}
          </p>
          <p style={{ fontWeight: 650, margin: '0 0 0.35rem', fontSize: '0.88rem' }}>
            Google-style
          </p>
          <ol style={{ margin: '0 0 0.85rem', paddingLeft: '1.15rem', fontSize: '0.88rem' }}>
            {(result.searchPlan.googleSearches || []).map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
          <p style={{ fontWeight: 650, margin: '0 0 0.35rem', fontSize: '0.88rem' }}>
            LLM-style (questions users ask AI)
          </p>
          <ol style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.88rem' }}>
            {(result.searchPlan.llmSearches || []).map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </section>
      )}

      {status === 'success' && result?.scraped && result.scraped.length > 0 && (
        <section style={{ marginTop: '1.5rem' }}>
          <h3>Rivals we read</h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {result.scraped.map((s, i) => (
              <li
                key={i}
                style={{
                  padding: '0.7rem 0.85rem',
                  border: `1px solid ${s.ok ? '#bbf7d0' : '#fecaca'}`,
                  background: s.ok ? '#f0fdf4' : '#fef2f2',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 650, color: '#374151', marginBottom: 4 }}>
                  {s.site || 'site'}
                </div>
                <strong>{s.title || s.url}</strong>{' '}
                {s.url && (
                  <a href={s.url} target="_blank" rel="noreferrer">
                    <FaExternalLinkAlt style={{ fontSize: '0.7rem' }} />
                  </a>
                )}
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>
                  {s.ok ? s.excerpt : `Failed: ${s.error}`}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict
          status={status}
          result={result}
          onRetry={run}
          loadingFlow="competitors"
          idleHint="Reverse-engineer searches, read other outlets, then see how your draft holds up."
        />
      </div>

      {status === 'success' && (
        <p style={{ marginTop: '1.25rem', color: '#15803d', fontWeight: 600 }}>
          You’re at the end of the edit flow. Fold any high-priority gaps back into your draft and
          score again if you want another pass.
        </p>
      )}
    </main>
  );
}

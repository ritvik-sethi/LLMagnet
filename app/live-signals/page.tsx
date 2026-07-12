'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaSatelliteDish, FaRocket, FaArrowRight, FaExternalLinkAlt } from 'react-icons/fa';
import CouncilVerdict, { CouncilResultView, CouncilStatus } from '@/components/CouncilVerdict';
import WowNote from '@/components/WowNote';
import {
  setCurrentStage,
  markStageComplete,
  stagePath,
  setLiveCheck,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

interface SearchHit {
  title: string;
  url: string;
  snippet: string;
  source: string;
  site?: string;
  engine?: string;
}

interface QuestionBlock {
  question: string;
  results: SearchHit[];
}

interface SocialItem {
  tag: 'SOCIAL';
  kind: 'x' | 'reddit' | 'news';
  title: string;
  url: string;
  site: string;
  summary: string;
}

interface LiveResult extends CouncilResultView {
  liveVerdict?: string;
  searchQueries?: {
    title: string;
    rephrased?: string;
    altPhrases?: string[];
    userQuestions: string[];
  };
  signals?: {
    social?: SocialItem[];
    userQuestions?: QuestionBlock[];
    peopleAlsoAsk?: { question: string; snippet: string; title: string; link: string }[];
    references: SearchHit[];
    providerNote: string;
  };
}

function kindLabel(kind: SocialItem['kind']) {
  if (kind === 'x') return 'X post';
  if (kind === 'reddit') return 'Reddit';
  return 'News';
}

export default function LiveSignalsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);
  const sourceUrl = useSelector((s: RootState) => s.editorialDraft.sourceUrl);

  const [status, setStatus] = useState<CouncilStatus>('idle');
  const [result, setResult] = useState<LiveResult | null>(null);

  useEffect(() => {
    dispatch(setCurrentStage('live'));
  }, [dispatch]);

  const run = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/live-signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading, content: body, sourceUrl }),
      });
      if (!res.ok) throw new Error('failed');
      const data = (await res.json()) as LiveResult;
      setResult(data);
      dispatch(
        setLiveCheck({
          liveVerdict: data.liveVerdict,
          rephrased: data.searchQueries?.rephrased,
          userQuestions: data.searchQueries?.userQuestions || [],
          social: (data.signals?.social || []).map((s) => ({
            kind: s.kind,
            title: s.title,
            url: s.url,
            site: s.site,
            summary: s.summary,
          })),
          peopleAlsoAsk: (data.signals?.peopleAlsoAsk || []).map((p) => ({
            question: p.question,
            snippet: p.snippet,
          })),
          capturedAt: new Date().toISOString(),
        })
      );
      dispatch(markStageComplete('live'));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="desk-page">
      <p className="desk-kicker">Step 3 of 6 · Reader questions &amp; social pulse</p>
      <h1 className="desk-title">
        <FaSatelliteDish /> Questions, X, Reddit &amp; fresh news
      </h1>
      <p className="desk-lede">
        We rephrase your title, then pull new X posts, Reddit threads, and other-outlet news —
        each tagged SOCIAL with a short summary so you can read sentiment fast. Plus the questions
        people Google around this topic.
      </p>

      <WowNote label="Wow">
        <strong>SOCIAL</strong> cards = X + Reddit + fresh news with editor summaries — not a dump
        of same-site title matches.
      </WowNote>

      <button
        className="ce-primary-btn"
        onClick={run}
        disabled={status === 'loading' || (!heading.trim() && !body.trim())}
      >
        <FaRocket />{' '}
        {status === 'loading' ? 'Fetching social & questions…' : 'Search questions & social pulse'}
      </button>

      {result?.liveVerdict && (
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.9rem 1.1rem',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
          }}
        >
          <strong>Desk note:</strong> {result.liveVerdict}
          {result.signals?.providerNote && (
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.35rem' }}>
              Via {result.signals.providerNote}
            </div>
          )}
        </div>
      )}

      {status === 'success' && result?.searchQueries && (
        <div className="desk-panel" style={{ marginTop: '1rem' }}>
          <p className="desk-label" style={{ marginBottom: 8 }}>
            What we searched
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.88rem', lineHeight: 1.55 }}>
            <li>
              <strong>Headline:</strong> {result.searchQueries.title}
            </li>
            {result.searchQueries.rephrased && (
              <li>
                <strong>Rephrased for social/news:</strong> {result.searchQueries.rephrased}
              </li>
            )}
            {(result.searchQueries.altPhrases || []).map((q, i) => (
              <li key={`alt-${i}`}>
                <strong>Alt phrase:</strong> {q}
              </li>
            ))}
            {(result.searchQueries.userQuestions || []).map((q, i) => (
              <li key={`uq-${i}`}>
                <strong>Reader question {i + 1}:</strong> {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === 'success' && (result?.signals?.social?.length ?? 0) > 0 && (
        <section className="desk-panel" style={{ marginTop: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>
            SOCIAL — X, Reddit &amp; fresh news (with summaries)
          </h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            {result!.signals!.social!.map((s, i) => (
              <li
                key={i}
                style={{
                  padding: '0.75rem 0.9rem',
                  background: '#fff',
                  border: '1px solid #d4d4d8',
                }}
              >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: '#ecfdf5',
                      color: '#065f46',
                      padding: '0.1rem 0.45rem',
                    }}
                  >
                    SOCIAL
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 650,
                      background: '#f3f4f6',
                      color: '#374151',
                      padding: '0.1rem 0.4rem',
                    }}
                  >
                    {kindLabel(s.kind)}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      background: '#eef2ff',
                      color: '#3730a3',
                      padding: '0.1rem 0.4rem',
                    }}
                  >
                    {s.site}
                  </span>
                </div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontWeight: 600, color: '#1d4ed8' }}
                >
                  {s.title} <FaExternalLinkAlt style={{ fontSize: '0.7rem' }} />
                </a>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', color: '#3f3f46', lineHeight: 1.45 }}>
                  {s.summary}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {status === 'success' && result?.signals && (
        <>
          {(result.signals.userQuestions || []).length > 0 && (
            <section className="desk-panel" style={{ marginTop: '1rem' }}>
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>
                Questions people ask — and the links Google shows them
              </h3>
              {(result.signals.userQuestions || []).map((block, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '1.1rem',
                    paddingBottom: '1rem',
                    borderBottom:
                      i < (result.signals?.userQuestions?.length || 0) - 1
                        ? '1px solid #e5e7eb'
                        : 'none',
                  }}
                >
                  <p style={{ fontWeight: 650, margin: '0 0 0.5rem' }}>“{block.question}”</p>
                  {block.results.length === 0 ? (
                    <p className="desk-meta">No links returned for this question.</p>
                  ) : (
                    <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem' }}>
                      {block.results.map((h, j) => (
                        <li key={j} style={{ marginBottom: '0.45rem' }}>
                          <a href={h.url} target="_blank" rel="noreferrer">
                            {h.title || h.url}
                          </a>
                          <span className="desk-meta"> · {h.site}</span>
                          {h.snippet && (
                            <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>{h.snippet}</div>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </section>
          )}

          {(result.signals.peopleAlsoAsk || []).length > 0 && (
            <section className="desk-panel">
              <h3 style={{ margin: '0 0 0.65rem', fontSize: '1.05rem' }}>
                People also ask (from Google)
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.9rem' }}>
                {(result.signals.peopleAlsoAsk || []).slice(0, 8).map((p, i) => (
                  <li key={i} style={{ marginBottom: '0.55rem' }}>
                    <strong>{p.question}</strong>
                    {p.snippet && (
                      <div style={{ color: '#6b7280', fontSize: '0.84rem' }}>{p.snippet}</div>
                    )}
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.84rem' }}
                      >
                        Open result <FaExternalLinkAlt style={{ fontSize: '0.65rem' }} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict
          status={status}
          result={result}
          onRetry={run}
          idleHint="Rephrase your title, then scan SOCIAL (X, Reddit, news) plus reader questions."
        />
      </div>

      {status === 'success' && (
        <button
          className="ce-primary-btn"
          style={{ marginTop: '1.5rem' }}
          onClick={() => {
            dispatch(setCurrentStage('suggest'));
            router.push(stagePath('suggest'));
          }}
        >
          <FaArrowRight /> Next: Get clear advice
        </button>
      )}
    </main>
  );
}

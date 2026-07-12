'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaLightbulb, FaRocket, FaArrowRight } from 'react-icons/fa';
import CouncilVerdict, { CouncilResultView, CouncilStatus } from '@/components/CouncilVerdict';
import WowNote from '@/components/WowNote';
import {
  setDraftHeading,
  setDraftBody,
  setCurrentStage,
  markStageComplete,
  stagePath,
  setAdvice,
  lockStartedFrom,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

interface SuggestResult extends CouncilResultView {
  shouldRewrite?: boolean;
  rewritePitch?: string;
}

export default function DeskSuggestPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);
  const score = useSelector((s: RootState) => s.editorialDraft.citabilityScore);
  const liveCheck = useSelector((s: RootState) => s.editorialDraft.liveCheck);

  const [status, setStatus] = useState<CouncilStatus>('idle');
  const [result, setResult] = useState<SuggestResult | null>(null);

  useEffect(() => {
    dispatch(setCurrentStage('suggest'));
  }, [dispatch]);

  const hasLive = Boolean(
    liveCheck &&
      ((liveCheck.social && liveCheck.social.length > 0) ||
        (liveCheck.userQuestions && liveCheck.userQuestions.length > 0) ||
        liveCheck.liveVerdict)
  );

  const run = async () => {
    dispatch(lockStartedFrom());
    setStatus('loading');
    try {
      const res = await fetch('/api/desk-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heading, content: body, score, liveCheck }),
      });
      if (!res.ok) throw new Error('failed');
      const data = (await res.json()) as SuggestResult;
      setResult(data);
      dispatch(
        setAdvice({
          rewritePitch: data.rewritePitch,
          shouldRewrite: data.shouldRewrite,
          humanSuggestions: data.humanEdge?.suggestions ?? data.reader?.suggestions ?? [],
          machineSuggestions: data.seoEditor?.suggestions ?? data.machine?.suggestions ?? [],
          reconciledAction: data.reconciledAction,
          comparison: data.comparison,
          capturedAt: new Date().toISOString(),
        })
      );
      dispatch(markStageComplete('suggest'));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="desk-page">
      <p className="desk-kicker">Step 4 of 6 · Get edit advice</p>
      <h1 className="desk-title">
        <FaLightbulb /> Get edit advice
      </h1>
      <p className="desk-lede">
        Suggestions are ranked against what Live check found — SOCIAL sentiment on X and Reddit,
        fresh news, and the questions readers are already Googling — not generic tips. Your
        headline, link, and body stay with you from Draft.
      </p>

      <WowNote label="Wow">
        Each move should point to a <strong>Live check signal</strong> (tweet / Reddit / question),
        then a concrete edit on this draft.
      </WowNote>

      <label className="desk-label">Working headline</label>
      <input
        className="desk-field"
        type="text"
        value={heading}
        onChange={(e) => dispatch(setDraftHeading(e.target.value))}
        placeholder="Article headline…"
      />
      <label className="desk-label">Article body</label>
      <textarea
        className="desk-field"
        value={body}
        onChange={(e) => dispatch(setDraftBody(e.target.value))}
        placeholder="Your working draft…"
        rows={8}
      />

      {hasLive ? (
        <div className="desk-panel" style={{ marginBottom: '1rem' }}>
          <p className="desk-label" style={{ marginBottom: 6 }}>
            Using Live check snapshot
          </p>
          {liveCheck?.liveVerdict && (
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>{liveCheck.liveVerdict}</p>
          )}
          <p className="desk-meta" style={{ margin: 0 }}>
            {(liveCheck?.social?.length ?? 0)} SOCIAL items ·{' '}
            {(liveCheck?.userQuestions?.length ?? 0)} reader questions
            {liveCheck?.rephrased ? ` · searched as “${liveCheck.rephrased}”` : ''}
          </p>
        </div>
      ) : (
        <p className="desk-meta" style={{ marginBottom: '1rem' }}>
          No Live check snapshot yet.{' '}
          <Link href={stagePath('live')}>Run Live check</Link> first for sentiment-backed advice —
          or continue and we’ll advise from the draft alone.
        </p>
      )}

      <button className="ce-primary-btn" onClick={run} disabled={status === 'loading' || !body.trim()}>
        <FaRocket />{' '}
        {status === 'loading'
          ? 'Matching draft to Live check…'
          : hasLive
            ? 'Get advice from Live check'
            : 'Get advice'}
      </button>

      <div style={{ marginTop: '1.5rem' }}>
        <CouncilVerdict
          status={status}
          result={result}
          onRetry={run}
          loadingFlow="suggest"
          idleHint="Advice will cite Live check SOCIAL sentiment and reader questions where available."
        />
      </div>

      {status === 'success' && result && result.shouldRewrite !== false && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1.1rem 1.25rem',
            borderRadius: 0,
            border: '1px solid #121212',
            background: 'rgba(255,255,255,0.85)',
          }}
        >
          <p
            style={{
              margin: '0 0 0.85rem',
              fontWeight: 600,
              fontSize: '1rem',
              lineHeight: 1.4,
            }}
          >
            {result.rewritePitch ||
              'Ready to densify the facts from Live check signals — without rewriting your voice?'}
          </p>
          <button
            className="ce-primary-btn"
            onClick={() => {
              dispatch(setCurrentStage('rewrite'));
              router.push(stagePath('rewrite'));
            }}
          >
            <FaArrowRight /> Yes — polish the draft
          </button>
        </div>
      )}
    </main>
  );
}

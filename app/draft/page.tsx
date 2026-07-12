'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaFileAlt, FaLink, FaArrowRight } from 'react-icons/fa';
import WowNote from '@/components/WowNote';
import {
  setDraftHeading,
  setDraftBody,
  setSourceUrl,
  lockStartedFrom,
  setCurrentStage,
  markStageComplete,
  stagePath,
} from '@/store/slices/editorialDraftSlice';
import type { RootState } from '@/store/store';

export default function DraftPastePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);
  const sourceUrl = useSelector((s: RootState) => s.editorialDraft.sourceUrl);

  const [urlInput, setUrlInput] = useState(sourceUrl || '');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(setCurrentStage('paste'));
  }, [dispatch]);

  useEffect(() => {
    if (sourceUrl && !urlInput) setUrlInput(sourceUrl);
  }, [sourceUrl, urlInput]);

  const fetchFromUrl = async () => {
    setFetchError(null);
    setFetching(true);
    try {
      const res = await fetch('/api/fetch-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fetch failed');
      if (data.title) dispatch(setDraftHeading(data.title));
      dispatch(setDraftBody(data.content));
      dispatch(setSourceUrl(data.url));
      dispatch(lockStartedFrom());
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Could not load that article');
    } finally {
      setFetching(false);
    }
  };

  const continueToScore = () => {
    dispatch(lockStartedFrom());
    dispatch(markStageComplete('paste'));
    dispatch(setCurrentStage('score'));
    router.push(stagePath('score'));
  };

  return (
    <main className="desk-page">
      <p className="desk-kicker">Step 1 of 6 · Open the article</p>
      <h1 className="desk-title">
        <FaFileAlt /> Open the article
      </h1>
      <p className="desk-lede">
        Paste a real news / business article — or drop a public article URL. Wikipedia dumps, social
        posts, and non-editorial text are rejected with ENTER A VALID PROMPT LINK. Everything that
        follows works on this same draft.
      </p>

      <WowNote label="Wow">
        One working copy for the whole edit flow. Score it, check the news cycle, polish it, and
        chase rivals — <strong>without ever leaving this story</strong>.
      </WowNote>

      <div className="desk-panel">
        <label className="desk-label">
          <FaLink style={{ marginRight: 6 }} />
          Or import from a published URL
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="desk-field"
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/your-story"
            style={{ flex: 1, minWidth: 220, marginBottom: 0 }}
          />
          <button
            className="ce-primary-btn"
            type="button"
            disabled={fetching || !urlInput.trim()}
            onClick={fetchFromUrl}
          >
            {fetching ? 'Pulling article…' : 'Import article'}
          </button>
        </div>
        {fetchError && (
          <p className="desk-meta" style={{ color: '#b91c1c', marginTop: 8 }}>
            {fetchError}
          </p>
        )}
        {sourceUrl && !fetchError && (
          <p className="desk-meta" style={{ color: '#15803d', marginTop: 8 }}>
            Loaded from {sourceUrl}
          </p>
        )}
      </div>

      <label className="desk-label">Headline</label>
      <input
        className="desk-field"
        type="text"
        value={heading}
        onChange={(e) => dispatch(setDraftHeading(e.target.value))}
        placeholder="e.g. Zepto raises $665M as quick-commerce heats up in India"
      />

      <label className="desk-label">Article body</label>
      <textarea
        className="desk-field"
        value={body}
        onChange={(e) => dispatch(setDraftBody(e.target.value))}
        placeholder="Paste your draft here…"
        rows={16}
      />

      <button className="ce-primary-btn" disabled={!body.trim()} onClick={continueToScore}>
        <FaArrowRight /> Continue to score
      </button>
    </main>
  );
}

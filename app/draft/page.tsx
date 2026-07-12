'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaFileAlt, FaArrowRight } from 'react-icons/fa';
import WowNote from '@/components/WowNote';
import SampleArticlePicker from '@/components/SampleArticlePicker';
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
import type { SampleArticle } from '@/lib/sampleArticles';

export default function DraftPastePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);
  const sourceUrl = useSelector((s: RootState) => s.editorialDraft.sourceUrl);

  useEffect(() => {
    dispatch(setCurrentStage('paste'));
  }, [dispatch]);

  const loadSample = (article: SampleArticle) => {
    dispatch(setDraftHeading(article.title));
    dispatch(setDraftBody(article.body));
    dispatch(setSourceUrl(article.url));
    dispatch(lockStartedFrom());
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
        Load a sample story, or edit the headline and body below. Everything that follows works on
        this same draft.
      </p>

      <WowNote label="Wow">
        One working copy for the whole edit flow. Score it, check the news cycle, polish it, and
        chase rivals — <strong>without ever leaving this story</strong>.
      </WowNote>

      <SampleArticlePicker activeUrl={sourceUrl} onSelect={loadSample} />

      {sourceUrl && (
        <p className="desk-meta" style={{ color: '#15803d', marginBottom: '1rem' }}>
          Sample article loaded
        </p>
      )}

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
        placeholder="Article body loads when you pick a sample…"
        rows={16}
      />

      <button className="ce-primary-btn" disabled={!body.trim()} onClick={continueToScore}>
        <FaArrowRight /> Continue to score
      </button>
    </main>
  );
}

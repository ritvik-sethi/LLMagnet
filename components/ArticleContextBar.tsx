'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { FaExternalLinkAlt, FaLink } from 'react-icons/fa';
import type { RootState } from '@/store/store';
import {
  resolveActiveStage,
  setDraftHeading,
  setSourceUrl,
  STAGES,
} from '@/store/slices/editorialDraftSlice';
import styles from '../styles/ArticleContextBar.module.scss';

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function ArticleContextBar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const activeId = resolveActiveStage(pathname);
  const heading = useSelector((s: RootState) => s.editorialDraft.heading);
  const body = useSelector((s: RootState) => s.editorialDraft.body);
  const sourceUrl = useSelector((s: RootState) => s.editorialDraft.sourceUrl);
  const originTitle = useSelector((s: RootState) => s.editorialDraft.originTitle);
  const originUrl = useSelector((s: RootState) => s.editorialDraft.originUrl);

  if (!activeId) return null;

  const stage = STAGES.find((s) => s.id === activeId);
  const hasArticle = Boolean(heading.trim() || body.trim() || sourceUrl.trim());
  const startedTitle = (originTitle || heading || '').trim();
  const startedUrl = (originUrl || sourceUrl || '').trim();

  if (!hasArticle) {
    return (
      <div className={styles.bar} aria-label="Article context">
        <div className={styles.stageTag}>
          <span className={styles.stageStep}>
            Stage {STAGES.findIndex((s) => s.id === activeId) + 1} of {STAGES.length}
          </span>
          <strong className={styles.stageName}>{stage?.label}</strong>
        </div>
        <p className={styles.empty}>
          No article loaded yet.{' '}
          <Link href="/draft">Start from a headline or link</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.bar} aria-label="Persisted article across pipeline">
      <div className={styles.top}>
        <div className={styles.stageTag}>
          <span className={styles.stageStep}>
            Stage {STAGES.findIndex((s) => s.id === activeId) + 1} of {STAGES.length}
          </span>
          <strong className={styles.stageName}>{stage?.headline || stage?.label}</strong>
        </div>

        {(startedTitle || startedUrl) && (
          <div className={styles.started}>
            <span className={styles.startedLabel}>Started from</span>
            {startedTitle ? (
              <span className={styles.startedTitle} title={startedTitle}>
                {startedTitle}
              </span>
            ) : null}
            {startedUrl ? (
              <a
                className={styles.startedLink}
                href={startedUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={startedUrl}
              >
                <FaExternalLinkAlt aria-hidden />
                {hostOf(startedUrl)}
              </a>
            ) : null}
          </div>
        )}
      </div>

      <div className={styles.fields}>
        <label className={styles.field}>
          <span>Working headline</span>
          <input
            type="text"
            value={heading}
            onChange={(e) => dispatch(setDraftHeading(e.target.value))}
            placeholder="Article headline…"
          />
        </label>
        <label className={styles.field}>
          <span>
            <FaLink aria-hidden /> Source link
          </span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => dispatch(setSourceUrl(e.target.value))}
            placeholder="https://…"
          />
        </label>
      </div>

      <p className={styles.bodyMeta}>
        {body.trim()
          ? `${body.trim().split(/\s+/).length} words carried into this stage`
          : 'Body empty — paste the article on Draft to continue.'}
      </p>
    </div>
  );
}

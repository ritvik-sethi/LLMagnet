'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import {
  STAGES,
  StageId,
  StageStatus,
  clearPersistedDraft,
  resolveActiveStage,
  resetDraft,
} from '@/store/slices/editorialDraftSlice';
import styles from '../styles/PipelineRail.module.scss';

function visualStatus(
  stageId: StageId,
  activeId: StageId | null,
  completed: boolean
): StageStatus {
  if (activeId === stageId) return 'current';
  if (completed) return 'completed';
  return 'upcoming';
}

export default function PipelineRail() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const stageStatus = useSelector((s: RootState) => s.editorialDraft.stageStatus);
  const citabilityScore = useSelector((s: RootState) => s.editorialDraft.citabilityScore);
  const activeId = resolveActiveStage(pathname);

  const prevScore = useRef<number | null>(null);
  const [bumped, setBumped] = useState(false);
  useEffect(() => {
    if (prevScore.current !== null && citabilityScore !== null && citabilityScore !== prevScore.current) {
      setBumped(true);
      const t = setTimeout(() => setBumped(false), 900);
      prevScore.current = citabilityScore;
      return () => clearTimeout(t);
    }
    prevScore.current = citabilityScore;
  }, [citabilityScore]);

  const onReset = () => {
    clearPersistedDraft();
    dispatch(resetDraft());
  };

  return (
    <div className={styles.rail} aria-label="Editorial pipeline progress">
      <ol className={styles.stages}>
        {STAGES.map((stage, i) => {
          const status = visualStatus(
            stage.id,
            activeId,
            stageStatus[stage.id] === 'completed'
          );
          return (
            <li key={stage.id} className={styles[status]}>
              <Link
                href={stage.path}
                className={styles.stageLink}
                aria-current={activeId === stage.id ? 'step' : undefined}
              >
                <span className={styles.stageIndex}>
                  {status === 'completed' && activeId !== stage.id ? '✓' : i + 1}
                </span>
                <span className={styles.stageLabel}>{stage.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className={styles.railEnd}>
        <div className={`${styles.score} ${bumped ? styles.bump : ''}`}>
          <span className={styles.scoreLabel}>How citeable</span>
          <span className={styles.scoreValue}>
            {citabilityScore === null ? 'not scored yet' : `${citabilityScore}/100`}
          </span>
        </div>
        <button
          type="button"
          className={`reset ${styles.reset}`}
          onClick={onReset}
          title="Start over with a fresh draft"
        >
          Start over
        </button>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { STAGES, StageStatus } from '@/store/slices/editorialDraftSlice';
import styles from '../styles/PipelineRail.module.scss';

export default function PipelineRail() {
  const pathname = usePathname();
  const stageStatus = useSelector((s: RootState) => s.editorialDraft.stageStatus);
  const citabilityScore = useSelector((s: RootState) => s.editorialDraft.citabilityScore);

  // Brief visual "bump" so a re-score is legible in a fast demo (KTD6 / R3).
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

  const stateClass = (status: StageStatus, isRouteActive: boolean) => {
    if (status === 'completed') return styles.completed;
    if (status === 'current' || isRouteActive) return styles.current;
    return styles.upcoming;
  };

  return (
    <div className={styles.rail} aria-label="Editorial pipeline progress">
      <ol className={styles.stages}>
        {STAGES.map((stage, i) => {
          const status = stageStatus[stage.id];
          const isRouteActive = pathname === stage.path && status !== 'completed';
          return (
            <li key={stage.id} className={stateClass(status, isRouteActive)}>
              <Link href={stage.path} className={styles.stageLink}>
                <span className={styles.stageIndex}>{status === 'completed' ? '✓' : i + 1}</span>
                <span className={styles.stageLabel}>{stage.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className={`${styles.score} ${bumped ? styles.bump : ''}`}>
        <span className={styles.scoreLabel}>Citability</span>
        <span className={styles.scoreValue}>
          {citabilityScore === null ? 'not scored yet' : `${citabilityScore}/100`}
        </span>
      </div>
    </div>
  );
}

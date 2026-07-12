'use client';

import { FaBookOpen, FaRobot, FaArrowRight } from 'react-icons/fa';
import AISparkleLoader from './AISparkleLoader';
import styles from '../styles/CouncilVerdict.module.scss';

// Client-side mirror of the server council shape (kept local so the client
// bundle doesn't import the server-only openai module).
export interface CouncilVoice {
  take: string;
  points: string[];
}
export interface CouncilResultView {
  score?: number;
  reader: CouncilVoice;
  machine: CouncilVoice;
  reconciledAction: string;
  rewrittenContent?: string;
}

export type CouncilStatus = 'idle' | 'loading' | 'error' | 'success';

interface Props {
  status: CouncilStatus;
  result?: CouncilResultView | null;
  onRetry?: () => void;
  idleHint?: string;
}

export default function CouncilVerdict({ status, result, onRetry, idleHint }: Props) {
  if (status === 'loading') {
    return (
      <div className={styles.state}>
        <AISparkleLoader isLoading />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`${styles.state} ${styles.error}`}>
        <p>The council couldn&apos;t weigh in. Please try again.</p>
        {onRetry && (
          <button className={styles.retry} onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (status === 'idle' || !result) {
    return (
      <div className={`${styles.state} ${styles.idle}`}>
        <p>{idleHint ?? 'Run the analysis to hear from The Reader and The Machine.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.verdict}>
      <div className={styles.panels}>
        <section className={`${styles.panel} ${styles.reader}`}>
          <header className={styles.panelHead}>
            <FaBookOpen aria-hidden />
            <span>The Reader</span>
          </header>
          <p className={styles.take}>{result.reader.take}</p>
          <ul>
            {result.reader.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>

        <section className={`${styles.panel} ${styles.machine}`}>
          <header className={styles.panelHead}>
            <FaRobot aria-hidden />
            <span>The Machine</span>
          </header>
          <p className={styles.take}>{result.machine.take}</p>
          <ul>
            {result.machine.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>
      </div>

      {result.reconciledAction && (
        <div className={styles.reconciled}>
          <FaArrowRight aria-hidden />
          <span>
            <strong>Do this:</strong> {result.reconciledAction}
          </span>
        </div>
      )}
    </div>
  );
}

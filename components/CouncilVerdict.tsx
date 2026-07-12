'use client';

import { FaUserEdit, FaSearchDollar, FaArrowRight, FaListOl } from 'react-icons/fa';
import AISparkleLoader from './AISparkleLoader';
import styles from '../styles/CouncilVerdict.module.scss';

export interface CouncilVoice {
  take: string;
  points: string[];
  suggestions?: string[];
}

export interface MatrixAxisScore {
  id: string;
  label: string;
  max: number;
  score: number;
  note: string;
}

export interface QueryArtifact {
  query: string;
  intent: string;
  citationPotential: number;
  why: string;
}

export interface TrendArtifact {
  angle: string;
  whyNow: string;
  howToFrame: string;
}

export interface GapArtifact {
  gap: string;
  severity: 'high' | 'medium' | 'low';
  howToClose: string;
}

export interface CouncilResultView {
  score?: number;
  breakdown?: MatrixAxisScore[];
  humanEdge: CouncilVoice;
  seoEditor: CouncilVoice;
  comparison?: {
    readerLens: string;
    aiLens: string;
    whereTheyClash: string;
  };
  reconciledAction: string;
  rewrittenContent?: string;
  changes?: { type: string; original?: string; revised?: string; reason: string }[];
  shouldRewrite?: boolean;
  rewritePitch?: string;
  liveVerdict?: string;
  queries?: QueryArtifact[];
  trends?: TrendArtifact[];
  gaps?: GapArtifact[];
  reader?: CouncilVoice;
  machine?: CouncilVoice;
}

export type CouncilStatus = 'idle' | 'loading' | 'error' | 'success';

interface Props {
  status: CouncilStatus;
  result?: CouncilResultView | null;
  onRetry?: () => void;
  idleHint?: string;
}

function VoicePanel({
  variant,
  title,
  subtitle,
  voice,
}: {
  variant: 'human' | 'seo';
  title: string;
  subtitle: string;
  voice: CouncilVoice;
}) {
  const suggestions = voice.suggestions ?? [];
  return (
    <section className={`${styles.panel} ${variant === 'human' ? styles.human : styles.seo}`}>
      <header className={styles.panelHead}>
        {variant === 'human' ? <FaUserEdit aria-hidden /> : <FaSearchDollar aria-hidden />}
        <div>
          <span className={styles.panelTitle}>{title}</span>
          <span className={styles.panelSub}>{subtitle}</span>
        </div>
      </header>
      <p className={styles.take}>{voice.take}</p>
      {voice.points?.length > 0 && (
        <ul>
          {voice.points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          <strong>What to do next</strong>
          <ol>
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
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
        <p>We couldn’t finish this review. Try again in a moment.</p>
        {onRetry && (
          <button className={styles.retry} onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  if (status === 'idle' || !result) {
    return (
      <div className={`${styles.state} ${styles.idle}`}>
        <p>
          {idleHint ??
            'Run the review to hear from both editors — the Human Edge and the SEO Specialist.'}
        </p>
      </div>
    );
  }

  const human = result.humanEdge || result.reader || { take: '', points: [], suggestions: [] };
  const seo = result.seoEditor || result.machine || { take: '', points: [], suggestions: [] };

  return (
    <div className={styles.verdict}>
      {result.breakdown && result.breakdown.length > 0 && (
        <section className={styles.matrix}>
          <header className={styles.matrixHead}>
            <FaListOl aria-hidden />
            <h3>Where the score comes from</h3>
            {typeof result.score === 'number' && (
              <span className={styles.matrixTotal}>{result.score}/100</span>
            )}
          </header>
          <div className={styles.matrixGrid}>
            {result.breakdown.map((axis) => {
              const pct = axis.max > 0 ? Math.min(100, (axis.score / axis.max) * 100) : 0;
              return (
                <article key={axis.id} className={styles.matrixCard}>
                  <div className={styles.matrixCardTop}>
                    <span className={styles.matrixLabel}>{axis.label}</span>
                    <span className={styles.matrixScore}>
                      {axis.score}
                      <small>/{axis.max}</small>
                    </span>
                  </div>
                  <div className={styles.bar}>
                    <div className={styles.barFill} style={{ width: `${pct}%` }} />
                  </div>
                  {axis.note && <p className={styles.matrixNote}>{axis.note}</p>}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className={styles.voiceLabel}>Reader vs AI — on this article</div>

      {result.comparison &&
        (result.comparison.readerLens ||
          result.comparison.aiLens ||
          result.comparison.whereTheyClash) && (
          <div className={styles.comparison}>
            <div className={styles.comparisonCol}>
              <span className={styles.comparisonTag}>Human reader</span>
              <p>{result.comparison.readerLens}</p>
            </div>
            <div className={styles.comparisonCol}>
              <span className={`${styles.comparisonTag} ${styles.aiTag}`}>AI / citation</span>
              <p>{result.comparison.aiLens}</p>
            </div>
            {result.comparison.whereTheyClash && (
              <div className={styles.clash}>
                <strong>Where they clash:</strong> {result.comparison.whereTheyClash}
              </div>
            )}
          </div>
        )}

      <div className={styles.panels}>
        <VoicePanel
          variant="human"
          title="For the human reader"
          subtitle="Story, clarity, trust — quotes from your draft"
          voice={human}
        />
        <VoicePanel
          variant="seo"
          title="For AI citation"
          subtitle="What ChatGPT/Gemini would quote — different from the reader"
          voice={seo}
        />
      </div>

      {result.queries && result.queries.length > 0 && (
        <section className={styles.artifacts}>
          <h3>Questions this story should win</h3>
          <ul className={styles.artifactList}>
            {result.queries.map((q, i) => (
              <li key={i}>
                <strong>{q.query}</strong>
                <span className={styles.meta}>
                  {q.intent} · cite {q.citationPotential}/100
                </span>
                <p>{q.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.trends && result.trends.length > 0 && (
        <section className={styles.artifacts}>
          <h3>Angles worth chasing</h3>
          <ul className={styles.artifactList}>
            {result.trends.map((t, i) => (
              <li key={i}>
                <strong>{t.angle}</strong>
                <p>
                  <em>Why now:</em> {t.whyNow}
                </p>
                <p>
                  <em>Frame:</em> {t.howToFrame}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.gaps && result.gaps.length > 0 && (
        <section className={styles.artifacts}>
          <h3>What rivals covered (and you didn’t)</h3>
          <ul className={styles.artifactList}>
            {result.gaps.map((g, i) => (
              <li key={i}>
                <strong>
                  <span className={`${styles.severity} ${styles[g.severity]}`}>{g.severity}</span>{' '}
                  {g.gap}
                </strong>
                <p>{g.howToClose}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.reconciledAction && (
        <div className={styles.reconciled}>
          <FaArrowRight aria-hidden />
          <span>
            <strong>Do this next:</strong> {result.reconciledAction}
          </span>
        </div>
      )}
    </div>
  );
}

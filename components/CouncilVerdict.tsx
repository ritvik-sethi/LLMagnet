'use client';

import { FaUserEdit, FaSearchDollar, FaArrowRight, FaListOl } from 'react-icons/fa';
import { motion, useReducedMotion } from 'framer-motion';
import AISparkleLoader from './AISparkleLoader';
import styles from '../styles/CouncilVerdict.module.scss';
import type { LoadingFlowId } from '@/lib/loadingFlows';

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

export interface CiteEntityRow {
  name: string;
  role: string;
  citableFact: string;
}

export interface CiteClaimAudit {
  claim: string;
  wouldCite: boolean;
  missing: string;
  fix: string;
}

export interface CiteLedger {
  entities: CiteEntityRow[];
  claimAudits: CiteClaimAudit[];
  deskMoves: string[];
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
  citeLedger?: CiteLedger;
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

/** Plain-language explainers for score axes — especially when we name frameworks like E-E-A-T. */
const AXIS_EXPLAINERS: Record<string, string> = {
  citationPotential:
    'Would ChatGPT or a similar answer engine lift a sentence from this draft when answering a user?',
  factualAuthority:
    'Named companies, people, figures, and dates present in the copy — the raw material of a quotable claim.',
  informationDensity:
    'Unique reported detail a model cannot get from a generic rewrite of the same headline.',
  structuralAccessibility:
    'Self-contained passages and clear hierarchy so a retriever can chunk and lift answers cleanly.',
  headingOptimization:
    'Whether the headline matches the questions humans and models actually ask about this story.',
  sourceCredibility:
    'E-E-A-T is Google’s quality framework: Experience (first-hand reporting texture), Expertise (precise sector knowledge), Authoritativeness (this piece as a go-to source), and Trust (accuracy, honesty, reliability). Trust is the center — we score attribution here: who said what, named sources, and whether absolute claims are backed. Unsourced “facts” lower this axis.',
  entityClarity: 'Companies and people named cleanly so a model can extract who is who.',
  relationshipMapping: 'Funding, rivalry, and role links stated explicitly in the draft.',
  topicHierarchy: 'Section logic / extractable hierarchy of the piece.',
  queryCoverage: 'Questions this draft actually answers (fan-out coverage).',
  schemaReadiness: 'Facts structured enough to lift without ambiguity.',
  semanticMarkers: 'Definitions and context cues that reduce mis-citation.',
};

interface Props {
  status: CouncilStatus;
  result?: CouncilResultView | null;
  onRetry?: () => void;
  idleHint?: string;
  /** Which pipeline step is loading — drives unique stage messages. */
  loadingFlow?: LoadingFlowId;
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

export default function CouncilVerdict({
  status,
  result,
  onRetry,
  idleHint,
  loadingFlow = 'score',
}: Props) {
  const reduceMotion = useReducedMotion();

  if (status === 'loading') {
    return (
      <div className={styles.loadingShell}>
        <AISparkleLoader isLoading flow={loadingFlow} />
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
          <div className={styles.matrixAmbient} aria-hidden />
          <header className={styles.matrixHead}>
            <div className={styles.matrixHeadLeft}>
              <FaListOl aria-hidden />
              <div>
                <h3>Where the score comes from</h3>
                <p className={styles.matrixLede}>
                  Six signals an answer engine weighs before it quotes you
                </p>
              </div>
            </div>
            {typeof result.score === 'number' && (
              <div className={styles.matrixTotalWrap}>
                <span className={styles.matrixTotalLabel}>Overall</span>
                <span className={styles.matrixTotal}>{result.score}<small>/100</small></span>
                <span className={styles.matrixTotalHint}>newsroom band 38–94</span>
              </div>
            )}
          </header>
          <div className={styles.matrixGrid}>
            {result.breakdown.map((axis, index) => {
              const pct = axis.max > 0 ? Math.min(100, (axis.score / axis.max) * 100) : 0;
              const explainer = AXIS_EXPLAINERS[axis.id];
              const tone = pct < 60 ? 'weak' : pct < 80 ? 'mid' : 'strong';
              return (
                <motion.article
                  key={axis.id}
                  className={`${styles.matrixCard} ${styles[`tone_${tone}`]}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.07,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className={styles.matrixCardTop}>
                    <span className={styles.matrixIndex}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.matrixLabel}>{axis.label}</span>
                    <span className={styles.matrixScore}>
                      {axis.score}
                      <small>/{axis.max}</small>
                    </span>
                  </div>
                  {explainer && <p className={styles.matrixExplain}>{explainer}</p>}
                  <div className={styles.bar}>
                    <motion.div
                      className={styles.barFill}
                      initial={reduceMotion ? false : { width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.15 + index * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <div className={styles.matrixBarMeta}>
                    <span>{Math.round(pct)}% of axis</span>
                    <span className={styles[`chip_${tone}`]}>
                      {tone === 'weak' ? 'Needs work' : tone === 'mid' ? 'Solid' : 'Strong'}
                    </span>
                  </div>
                  {axis.note && <p className={styles.matrixNote}>{axis.note}</p>}
                </motion.article>
              );
            })}
          </div>
        </section>
      )}

      {result.citeLedger &&
        ((result.citeLedger.entities?.length ?? 0) > 0 ||
          (result.citeLedger.claimAudits?.length ?? 0) > 0 ||
          (result.citeLedger.deskMoves?.length ?? 0) > 0) && (
          <section className={styles.ledger}>
            <header className={styles.ledgerHead}>
              <h3>Cite ledger — what to densify</h3>
              <p>Entity map, claim-level audits, and desk moves grounded in this draft</p>
            </header>

            {(result.citeLedger.entities?.length ?? 0) > 0 && (
              <div className={styles.ledgerBlock}>
                <h4>Entities</h4>
                <ul className={styles.ledgerList}>
                  {result.citeLedger.entities!.map((e, i) => (
                    <li key={`${e.name}-${i}`}>
                      <strong>{e.name}</strong>
                      <span className={styles.meta}>{e.role}</span>
                      <p>{e.citableFact}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(result.citeLedger.claimAudits?.length ?? 0) > 0 && (
              <div className={styles.ledgerBlock}>
                <h4>Claim audits</h4>
                <ul className={styles.ledgerList}>
                  {result.citeLedger.claimAudits!.map((c, i) => (
                    <li key={i}>
                      <strong>
                        <span
                          className={`${styles.severity} ${
                            c.wouldCite ? styles.low : styles.high
                          }`}
                        >
                          {c.wouldCite ? 'would cite' : 'refuse'}
                        </span>{' '}
                        {c.claim}
                      </strong>
                      {c.missing && (
                        <p>
                          <em>Missing:</em> {c.missing}
                        </p>
                      )}
                      {c.fix && (
                        <p>
                          <em>Fix:</em> {c.fix}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(result.citeLedger.deskMoves?.length ?? 0) > 0 && (
              <div className={styles.ledgerBlock}>
                <h4>Desk moves</h4>
                <ol className={styles.deskMoves}>
                  {result.citeLedger.deskMoves!.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ol>
              </div>
            )}
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

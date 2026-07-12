'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import styles from '@/styles/AISparkleLoader.module.scss';
import { LOADING_FLOWS, shuffleVerbs, type LoadingFlowId } from '@/lib/loadingFlows';

interface AISparkleLoaderProps {
  isLoading: boolean;
  className?: string;
  /** Pipeline step — drives unique immersive stage copy. */
  flow?: LoadingFlowId;
  /** Optional override; wins over `flow`. */
  stages?: string[];
  title?: string;
}

const VERB_HOLD_MS = 5000;

export default function AISparkleLoader({
  isLoading,
  className = '',
  flow = 'score',
  stages: stagesProp,
  title: titleProp,
}: AISparkleLoaderProps) {
  const reduceMotion = useReducedMotion();
  const flowDef = LOADING_FLOWS[flow];
  const stages = stagesProp?.length ? stagesProp : flowDef.stages;
  const title = titleProp || flowDef.title;

  const verbDeck = useMemo(
    () => (isLoading ? shuffleVerbs(Date.now() + flow.length * 97) : []),
    // Reshuffle only when a new loading session / flow starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading, flow]
  );

  const [step, setStep] = useState(0);
  const [verbIndex, setVerbIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!isLoading || !loaderRef.current) return;
    const t = setTimeout(() => {
      loaderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
    return () => clearTimeout(t);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setStep(0);
      setVerbIndex(0);
      setElapsedMs(0);
      return;
    }

    startedAt.current = Date.now();
    setStep(0);
    setVerbIndex(0);
    setElapsedMs(0);

    const delays = stages.map((_, i) => 2200 + (i % 3) * 400);
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;

    const advance = () => {
      i += 1;
      if (i >= stages.length) return;
      setStep(i);
      timer = setTimeout(advance, delays[i] ?? 2400);
    };
    timer = setTimeout(advance, delays[0] ?? 2400);

    const verbTimer = setInterval(() => {
      setVerbIndex((v) => (v + 1) % Math.max(verbDeck.length, 1));
    }, VERB_HOLD_MS);

    const clock = setInterval(() => {
      setElapsedMs(Date.now() - startedAt.current);
    }, 200);

    return () => {
      clearTimeout(timer);
      clearInterval(verbTimer);
      clearInterval(clock);
    };
  }, [isLoading, stages, verbDeck.length]);

  if (!isLoading) return null;

  const elapsed = (elapsedMs / 1000).toFixed(0);
  const progress = ((step + 0.55) / stages.length) * 100;
  const verb = verbDeck[verbIndex] || verbDeck[0] || 'Tinkering';

  return (
    <motion.div
      ref={loaderRef}
      className={`${styles.panel} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={title}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.ambient} aria-hidden />

      <div className={styles.row}>
        <div className={styles.mark} aria-hidden>
          <motion.span
            className={styles.orb}
            animate={
              reduceMotion
                ? undefined
                : { scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }
            }
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className={styles.orbRing}
            animate={reduceMotion ? undefined : { scale: [1, 1.7], opacity: [0.35, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          />
        </div>

        <div className={styles.copy}>
          <div className={styles.meta}>
            <AnimatePresence mode="wait">
              <motion.span
                key={verb}
                className={styles.thinking}
                initial={reduceMotion ? false : { opacity: 0, y: 4, filter: 'blur(3px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -4, filter: 'blur(3px)' }}
                transition={{ duration: 0.35 }}
              >
                {verb}
              </motion.span>
            </AnimatePresence>
            <span className={styles.sep}>·</span>
            <span className={styles.flowTitle}>{title}</span>
            <span className={styles.sep}>·</span>
            <span className={styles.elapsed}>{elapsed}s</span>
            <span className={styles.sep}>·</span>
            <span className={styles.stepCount}>
              {step + 1}/{stages.length}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={`${flow}-${stages[step]}`}
              className={styles.status}
              initial={reduceMotion ? false : { opacity: 0, y: 6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(3px)' }}
              transition={{ duration: 0.35 }}
            >
              {stages[step]}
              <span className={styles.caret} aria-hidden />
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className={styles.track} aria-hidden>
        <motion.div
          className={styles.fill}
          animate={{ width: `${Math.min(94, Math.max(10, progress))}%` }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
        {!reduceMotion && <span className={styles.shimmer} />}
      </div>

      <ul className={styles.steps}>
        {stages.map((label, i) => {
          const state = i < step ? 'done' : i === step ? 'active' : 'pending';
          return (
            <motion.li
              key={`${flow}-${label}`}
              className={`${styles.step} ${styles[state]}`}
              initial={reduceMotion ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <span className={styles.dot} />
              <span className={styles.stepLabel}>{label}</span>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import * as Diff from 'diff';
import styles from '../styles/RewriteDiff.module.scss';

export interface RewriteChange {
  type: 'add' | 'edit' | 'remove';
  original?: string;
  revised?: string;
  reason: string;
}

interface Props {
  original: string;
  revised: string;
  changes?: RewriteChange[];
}

function findReason(part: string, changes: RewriteChange[], kind: 'add' | 'remove'): string | null {
  const needle = part.trim().slice(0, 80).toLowerCase();
  if (!needle) return null;
  for (const c of changes) {
    if (kind === 'add' && c.type !== 'remove') {
      const hay = (c.revised ?? '').toLowerCase();
      if (hay && (hay.includes(needle) || needle.includes(hay.slice(0, 40)))) return c.reason;
    }
    if (kind === 'remove' && c.type !== 'add') {
      const hay = (c.original ?? '').toLowerCase();
      if (hay && (hay.includes(needle) || needle.includes(hay.slice(0, 40)))) return c.reason;
    }
    if (c.type === 'edit') {
      const o = (c.original ?? '').toLowerCase();
      const r = (c.revised ?? '').toLowerCase();
      if ((o && (o.includes(needle) || needle.includes(o.slice(0, 40)))) ||
          (r && (r.includes(needle) || needle.includes(r.slice(0, 40))))) {
        return c.reason;
      }
    }
  }
  return null;
}

export default function RewriteDiff({ original, revised, changes = [] }: Props) {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);

  const parts = useMemo(() => Diff.diffWordsWithSpace(original, revised), [original, revised]);

  return (
    <div className={styles.wrap}>
      <div className={styles.legend}>
        <span className={styles.add}>added</span>
        <span className={styles.edit}>edited</span>
        <span className={styles.del}>removed</span>
        <span className={styles.hint}>Hover a highlight to see why it changed</span>
      </div>
      <div className={styles.diff} aria-label="Rewrite diff">
        {parts.map((part, i) => {
          if (part.added) {
            const reason =
              findReason(part.value, changes, 'add') || 'Fact / clarity densified for citability.';
            return (
              <span
                key={i}
                className={styles.ins}
                title={reason}
                onMouseEnter={(e) =>
                  setTip({ text: reason, x: e.clientX, y: e.clientY })
                }
                onMouseMove={(e) => setTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t))}
                onMouseLeave={() => setTip(null)}
              >
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            const reason =
              findReason(part.value, changes, 'remove') || 'Removed for clarity / accuracy.';
            // Peek ahead: if next is added, treat as edit (yellow)
            const next = parts[i + 1];
            const isEdit = Boolean(next?.added);
            return (
              <span
                key={i}
                className={isEdit ? styles.mod : styles.delSpan}
                title={reason}
                onMouseEnter={(e) =>
                  setTip({ text: reason, x: e.clientX, y: e.clientY })
                }
                onMouseMove={(e) => setTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t))}
                onMouseLeave={() => setTip(null)}
              >
                {part.value}
              </span>
            );
          }
          return <span key={i}>{part.value}</span>;
        })}
      </div>
      {tip && (
        <div className={styles.tooltip} style={{ left: tip.x + 12, top: tip.y + 12 }}>
          {tip.text}
        </div>
      )}
    </div>
  );
}

'use client';

import { ReactNode } from 'react';
import styles from '../styles/WowNote.module.scss';

export default function WowNote({
  label = 'Worth noticing',
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <aside className={styles.note} role="note">
      <span className={styles.label}>{label}</span>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}

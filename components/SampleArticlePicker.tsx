'use client';

import { SAMPLE_ARTICLES, type SampleArticle } from '@/lib/sampleArticles';
import styles from '../styles/SampleArticles.module.scss';

interface Props {
  activeUrl?: string;
  onSelect: (article: SampleArticle) => void;
}

export default function SampleArticlePicker({ activeUrl, onSelect }: Props) {
  return (
    <div className={styles.wrap}>
      <p className={styles.label}>Load a sample article</p>
      <p className={styles.hint}>
        Pick a sample story to run through the pipeline — headline and body load instantly.
      </p>
      <ul className={styles.list}>
        {SAMPLE_ARTICLES.map((article) => {
          const active = activeUrl === article.url;
          return (
            <li key={article.id}>
              <button
                type="button"
                data-variant="ghost"
                className={`${styles.card} ${active ? styles.active : ''}`}
                onClick={() => onSelect(article)}
              >
                <span className={styles.section}>{article.section}</span>
                <span className={styles.title}>{article.title}</span>
                <span className={styles.dek}>{article.dek}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

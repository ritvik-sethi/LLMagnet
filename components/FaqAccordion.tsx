'use client';

import { useState } from 'react';
import styles from '../styles/MarketingExtras.module.scss';

const FAQ_ITEMS = [
  {
    q: 'What does “citeability” mean here?',
    a: 'Whether an answer engine would lift a sentence from your piece when answering a user — denser claims, named entities, attribution, and extractable structure.',
  },
  {
    q: 'Why isn’t Claude in the live citation probe?',
    a: 'Claude rarely cites sources the way answer engines do. We still edit for machines; the live probe focuses on models that actually quote.',
  },
  {
    q: 'How should I read the score?',
    a: 'You see x/100 inside a newsroom band (roughly high-30s to mid-90s). The number is blended from live citation probes plus deterministic article signals — so soft drafts and dense drafts land apart. The matrix notes and cite ledger name exact quotes, missing sources, and desk moves.',
  },
  {
    q: 'Does my draft persist across the six stages?',
    a: 'Yes. Headline, body, and source link travel with you. Score, Live check, and Advice feed later steps so you don’t re-paste.',
  },
  {
    q: 'What does Live check actually use?',
    a: 'A rephrased search, reader Google questions, and SOCIAL items from X, Reddit, and fresh news — each with a short sentiment summary.',
  },
  {
    q: 'Where do the sample articles come from?',
    a: 'They’re curated sample pieces bundled in the demo — pick one on Draft (or Polish) to load headline and body. You can still edit the text after it loads.',
  },
  {
    q: 'What happens to the working draft?',
    a: 'This demo sends the draft to configured AI and search services to score and edit. Don’t put secrets in the body. Use Start over to clear.',
  },
  {
    q: 'How is this different from a blank chat?',
    a: 'It’s a newsroom pipeline: one working article, live pressure-test, two editor voices, claim-checked polish, and rival gap analysis — so edits carry context instead of starting over in a new thread.',
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className={styles.faq}>
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}>
            <button
              type="button"
              data-variant="ghost"
              className={styles.faqQ}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span>{item.q}</span>
              <span className={styles.faqIcon} aria-hidden>
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && <p className={styles.faqA}>{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}

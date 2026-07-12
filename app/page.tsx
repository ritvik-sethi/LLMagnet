import React from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.scss';
import {
  FaChartLine,
  FaBrain,
  FaSearch,
  FaPenFancy,
  FaChartBar,
  FaUsers,
  FaArrowRight,
} from 'react-icons/fa';
import ComparisonTable from '@/components/ComparisonTable';
import FaqAccordion from '@/components/FaqAccordion';

export default function Home() {
  const features = [
    {
      title: 'Bring in your article',
      description:
        'Paste the piece you’re editing, or drop a published URL. One draft stays with you through every editing step.',
      path: '/draft',
      icon: <FaPenFancy className={styles.icon} />,
      wow: 'No more copy-paste between six tabs.',
    },
    {
      title: 'See how citeable it is',
      description:
        'A clear score for how likely answer engines are to quote you — plus why, in plain English.',
      path: '/content-seo-score',
      icon: <FaChartLine className={styles.icon} />,
      wow: 'Two editors argue: human reader vs AI discoverability.',
    },
    {
      title: 'Check what’s live right now',
      description:
        'We pull Google, similar coverage, and X — then hold your draft up against what’s circulating today.',
      path: '/live-signals',
      icon: <FaChartBar className={styles.icon} />,
      wow: 'Every source shows the site it came from.',
    },
    {
      title: 'Get concrete edit advice',
      description:
        'Clear next moves before you touch the text — then a simple ask: ready to polish without losing your voice?',
      path: '/desk-suggest',
      icon: <FaBrain className={styles.icon} />,
      wow: 'Advice ranked by impact, not jargon.',
    },
    {
      title: 'Polish the article',
      description:
        'We densify facts from the web, keep your tone, and return a fuller rewrite plus a plain list of what was added.',
      path: '/rewrite-for-llm',
      icon: <FaSearch className={styles.icon} />,
      wow: 'Clean polished copy · bullet list of what changed.',
    },
    {
      title: 'See what rivals covered',
      description:
        'We find and read competing articles, then flag the angles and facts they have that you don’t.',
      path: '/competitor-gap-analysis',
      icon: <FaUsers className={styles.icon} />,
      wow: 'Walk out knowing exactly what to report next.',
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Open with your draft',
      description: 'Paste or import a URL. That article becomes the single working copy for the whole flow.',
    },
    {
      number: 2,
      title: 'Score it, then pressure-test it',
      description: 'Get a citability score, then check Google and X so you know if you’re behind the news cycle.',
    },
    {
      number: 3,
      title: 'Polish, then close the gaps',
      description: 'Accept the rewrite, then see what rival coverage still has on you — and fix it.',
    },
  ];

  return (
    <div>
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <p className={styles.heroBrand}>LLMagnet</p>
          <p className={styles.heroEyebrow}>Article editing for LLM citation</p>
          <h1 className={styles.title}>
            If AI answers the question,
            <br />
            <span className={styles.titleAccent}>make it quote you.</span>
          </h1>
          <p className={styles.subtitle}>
            Score citeability. Pressure-test the news cycle. Edit for machines without killing the story.
          </p>
          <div className={styles.heroActions}>
            <Link href="/draft" className={styles.heroCta}>
              Start editing <FaArrowRight />
            </Link>
            <Link href="/content-seo-score" className={styles.heroGhost}>
              Jump to score
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.wowStrip}>
        <div className={styles.wowStripInner}>
          <div>
            <strong>Two editors in every step</strong>
            <span>The Human Edge and the SEO Specialist Editor — side by side, always.</span>
          </div>
          <div>
            <strong>One draft, whole journey</strong>
            <span>Score → live check → advice → polish → rivals. No re-pasting.</span>
          </div>
          <div>
            <strong>Context carries forward</strong>
            <span>Score, live signals, and advice feed the next prompt — not a fresh start each time.</span>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <header className={styles.sectionHead}>
            <p className={styles.sectionKicker}>What you’ll notice</p>
            <h2 className={styles.sectionTitle}>Editing moves that make citeability feel unfairly clear</h2>
          </header>
          <div className={styles.featuresGrid}>
            {features.map((feature) => (
              <Link key={feature.path} href={feature.path} className={styles.featureCard}>
                {feature.icon}
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
                <p className={styles.featureWow}>{feature.wow}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.howItWorks}>
        <div className={styles.howItWorksContainer}>
          <header className={styles.sectionHead}>
            <p className={styles.sectionKicker}>How editing works here</p>
            <h2 className={styles.sectionTitle}>Three beats. You’re done before the next stand-up.</h2>
          </header>
          <div className={styles.steps}>
            {steps.map((step) => (
              <div key={step.number} className={styles.step}>
                <div className={styles.stepNumber}>{step.number}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            ))}
          </div>
          <div className={styles.howCtaWrap}>
            <Link href="/draft" className={styles.heroCta}>
              Start with your draft <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.marketingBlock}>
        <div className={styles.marketingInner}>
          <header className={styles.sectionHead}>
            <p className={styles.sectionKicker}>Why not just ChatGPT?</p>
            <h2 className={styles.sectionTitle}>LLMagnet vs OpenAI vs Claude</h2>
          </header>
          <ComparisonTable />
        </div>
      </section>

      <section className={styles.marketingBlockAlt}>
        <div className={styles.marketingInner}>
          <header className={styles.sectionHead}>
            <p className={styles.sectionKicker}>FAQ</p>
            <h2 className={styles.sectionTitle}>Questions editors ask first</h2>
          </header>
          <FaqAccordion />
        </div>
      </section>
    </div>
  );
}

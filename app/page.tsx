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

export default function Home() {
  const features = [
    {
      title: 'Bring in your story',
      description:
        'Paste the piece you’re working on, or drop a published URL. One draft travels with you through every desk step.',
      path: '/draft',
      icon: <FaPenFancy className={styles.icon} />,
      wow: 'No more copy-paste between six tabs.',
    },
    {
      title: 'See how citeable it is',
      description:
        'A clear score for how likely ChatGPT, Gemini, or Claude is to quote you — plus why, in plain English.',
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
      title: 'Get honest desk advice',
      description:
        'Concrete next moves before you touch the text — then a clear ask: ready to polish without losing your voice?',
      path: '/desk-suggest',
      icon: <FaBrain className={styles.icon} />,
      wow: 'Advice ranked by impact, not jargon.',
    },
    {
      title: 'Polish with tracked changes',
      description:
        'We densify facts from the web, keep your tone, and show every edit like a markup pass — hover to see why.',
      path: '/rewrite-for-llm',
      icon: <FaSearch className={styles.icon} />,
      wow: 'Green added · amber edited · red cut — with reasons.',
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
      description: 'Paste or import a URL. That story becomes the single working copy for the whole flow.',
    },
    {
      number: 2,
      title: 'Score it, then pressure-test it',
      description: 'Get a citability score, then check Google and X so you know if you’re behind the news cycle.',
    },
    {
      number: 3,
      title: 'Polish, then close the gaps',
      description: 'Accept tracked changes, then see what rival coverage still has on you — and fix it.',
    },
  ];

  return (
    <div>
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <img src="/logo.svg" alt="LLMagnet" className={styles.heroLogo} />
          <p className={styles.heroEyebrow}>For newsrooms covering startups &amp; markets</p>
          <h1 className={styles.title}>
            Write once. Get cited by readers — and by AI.
          </h1>
          <h2 className={styles.subHeading}>
            LLMagnet is your desk companion: score how citeable your story is, check what’s live on
            Google and X, polish facts without killing your voice, and see what competitors already
            covered.
          </h2>
          <p className={styles.subtitle}>
            Built for reporters and editors who don’t have time for SEO theatre — just a clearer path
            from draft to a piece machines actually quote.
          </p>
          <Link href="/draft" className={styles.heroCta}>
            Start with your draft <FaArrowRight />
          </Link>
        </div>
      </section>

      <section className={styles.wowStrip}>
        <div className={styles.wowStripInner}>
          <div>
            <strong>Two desks in every step</strong>
            <span>The Human Edge and the SEO Specialist Editor — side by side, always.</span>
          </div>
          <div>
            <strong>One draft, whole journey</strong>
            <span>Score → live check → advice → polish → rivals. No re-pasting.</span>
          </div>
          <div>
            <strong>Edits you can trust</strong>
            <span>Tracked changes with hover reasons — and sources named by site.</span>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <header className={styles.sectionHead}>
            <p className={styles.sectionKicker}>What you’ll notice</p>
            <h2 className={styles.sectionTitle}>Moments that make the desk feel unfairly good</h2>
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
            <p className={styles.sectionKicker}>How the desk works</p>
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
              Open the desk <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

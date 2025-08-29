import React from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.scss';
import { 
  FaChartLine, 
  FaBrain, 
  FaSearch, 
  FaPenFancy, 
  FaChartBar, 
  FaUsers 
} from 'react-icons/fa';

export default function Home() {
  const features = [
    {
      title: 'Content Score',
      description: 'Analyze and optimize your content for better search engine rankings',
      path: '/content-seo-score',
      icon: <FaChartLine className={styles.icon} />
    },
    {
      title: 'Semantic Score',
      description: 'Understand the semantic relevance of your content to search queries',
      path: '/semantic-seo-score',
      icon: <FaBrain className={styles.icon} />
    },
    {
      title: 'Query Optimizer',
      description: 'Input and analyze search queries to improve content targeting',
      path: '/query-optimizer',
      icon: <FaSearch className={styles.icon} />
    },
    {
      title: 'Rewrite Tool',
      description: 'AI-powered content rewriting for better SEO performance',
      path: '/rewrite-for-llm',
      icon: <FaPenFancy className={styles.icon} />
    },
    {
      title: 'Trends',
      description: 'Track and analyze SEO trends in your industry',
      path: '/trend-alerts',
      icon: <FaChartBar className={styles.icon} />
    },
    {
      title: 'Competitor Gap',
      description: 'Identify content gaps compared to your competitors',
      path: '/competitor-gap-analysis',
      icon: <FaUsers className={styles.icon} />
    }
  ];

  const steps = [
    {
      number: 1,
      title: 'Input Your Content',
      description: 'Paste your content or URL to begin the analysis'
    },
    {
      number: 2,
      title: 'Get Insights',
      description: 'Receive detailed SEO analysis and recommendations'
    },
    {
      number: 3,
      title: 'Optimize & Improve',
      description: 'Implement suggestions to boost your search rankings'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <img src="/logo.svg" alt="LLMagnet Logo" className={styles.heroLogo} />
          <h1 className={styles.title}>
          Engineering Discoverability for the Next Generation of Search.
          </h1>
          <h2 className={styles.subHeading}>
          Optimize your content to boost search rankings and earn more LLM citations.
          </h2 >
          <p className={styles.subtitle}>
            Our comprehensive suite of SEO tools helps you analyze, optimize, and improve your content&apos;s performance in search engines.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <div className={styles.featuresGrid}>
            {features.map((feature) => (
              <Link 
                key={feature.path} 
                href={feature.path}
                className={styles.featureCard}
              >
                {feature.icon}
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.howItWorksContainer}>
          <div className={styles.steps}>
            {steps.map((step) => (
              <div key={step.number} className={styles.step}>
                <div className={styles.stepNumber}>{step.number}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

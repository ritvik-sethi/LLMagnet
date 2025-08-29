'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaChartLine, 
  FaBrain, 
  FaSearch, 
  FaPenFancy, 
  FaChartBar, 
  FaUsers,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRocket,
  FaCrosshairs,
  FaBullseye,
  FaTrophy,
  FaLightbulb,
  FaCog,
  FaSync
} from 'react-icons/fa';
import styles from './Dashboard.module.scss';

interface DashboardMetrics {
  llmCitationScore?: {
    overallScore: number;
    breakdown: {
      factualAuthority: number;
      clarityOfClaims: number;
      informationDensity: number;
      structuralAccessibility: number;
      sourceCredibility: number;
      temporalRelevance: number;
    };
    citationLikelihood: string;
  };
  aiSearchOptimization?: {
    knowledgeGraphCompatibility: {
      score: number;
      entityRecognition: string[];
      improvementAreas: string[];
    };
    semanticUnderstanding: {
      score: number;
      languagePatterns: string[];
      authoritySignals: string[];
    };
    queryMatching: {
      score: number;
      coveredQueries: string[];
      queryGaps: string[];
    };
  };
  llmSeoMetrics?: {
    citationLikelihood: number;
    authorityScore: number;
    informationValue: number;
    structuralOptimization: number;
    competitivePosition: string;
  };
  llmOptimizationRecommendations?: {
    critical: Array<{
      recommendation: string;
      impact: string;
      effort: string;
      llmBenefit: string;
    }>;
    highPriority: Array<{
      recommendation: string;
      impact: string;
      effort: string;
      llmBenefit: string;
    }>;
  };
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration - replace with actual API calls
  const mockMetrics: DashboardMetrics = {
    llmCitationScore: {
      overallScore: 87,
      breakdown: {
        factualAuthority: 22,
        clarityOfClaims: 18,
        informationDensity: 17,
        structuralAccessibility: 13,
        sourceCredibility: 9,
        temporalRelevance: 8
      },
      citationLikelihood: 'high'
    },
    aiSearchOptimization: {
      knowledgeGraphCompatibility: {
        score: 85,
        entityRecognition: ['AI', 'Machine Learning', 'SEO', 'Content Marketing'],
        improvementAreas: ['Add more specific entities', 'Include industry terminology']
      },
      semanticUnderstanding: {
        score: 82,
        languagePatterns: ['Expert terminology', 'Clear definitions', 'Structured information'],
        authoritySignals: ['Research citations', 'Expert quotes', 'Data presentation']
      },
      queryMatching: {
        score: 78,
        coveredQueries: ['What is LLM SEO?', 'How to optimize for AI search?'],
        queryGaps: ['LLM citation strategies', 'AI authority building']
      }
    },
    llmSeoMetrics: {
      citationLikelihood: 87,
      authorityScore: 85,
      informationValue: 82,
      structuralOptimization: 79,
      competitivePosition: 'leading'
    },
    llmOptimizationRecommendations: {
      critical: [
        {
          recommendation: 'Add more specific factual claims',
          impact: 'high',
          effort: 'low',
          llmBenefit: 'Increase citation likelihood by 15%'
        },
        {
          recommendation: 'Include expert quotes and citations',
          impact: 'high',
          effort: 'medium',
          llmBenefit: 'Boost authority recognition by 20%'
        }
      ],
      highPriority: [
        {
          recommendation: 'Optimize content structure for AI parsing',
          impact: 'medium',
          effort: 'low',
          llmBenefit: 'Improve extraction ease by 12%'
        },
        {
          recommendation: 'Add semantic markers and contextual cues',
          impact: 'medium',
          effort: 'medium',
          llmBenefit: 'Enhance knowledge graph compatibility'
        }
      ]
    }
  };

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setMetrics(mockMetrics);
      setIsLoading(false);
    }, 2000);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <FaCheck className={styles.scoreIcon} />;
    if (score >= 60) return <FaExclamationTriangle className={styles.scoreIcon} />;
    return <FaExclamationTriangle className={styles.scoreIcon} />;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <FaArrowUp className={styles.trendUp} />;
    if (current < previous) return <FaArrowDown className={styles.trendDown} />;
    return <FaMinus className={styles.trendNeutral} />;
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading LLM SEO Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>
              <FaBrain className={styles.titleIcon} />
              LLM SEO Dashboard
            </h1>
            <p className={styles.subtitle}>
              Comprehensive analysis of your content's AI search optimization and citation potential
            </p>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.refreshButton}>
              <FaSync className={styles.icon} />
              Refresh Data
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaChartLine className={styles.icon} />
          Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'metrics' ? styles.active : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <FaCrosshairs className={styles.icon} />
          Detailed Metrics
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'recommendations' ? styles.active : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <FaLightbulb className={styles.icon} />
          Recommendations
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'optimization' ? styles.active : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          <FaCog className={styles.icon} />
          Optimization
        </button>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            {/* Key Metrics Cards */}
            <section className={styles.keyMetrics}>
              <h2 className={styles.sectionTitle}>
                <FaTrophy className={styles.icon} />
                Key Performance Indicators
              </h2>
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <FaBrain className={styles.metricIcon} />
                    <span className={styles.metricLabel}>LLM Citation Score</span>
                  </div>
                  <div className={styles.metricValue}>
                    {metrics?.llmCitationScore?.overallScore || 0}
                    <span className={styles.metricUnit}>/100</span>
                  </div>
                  <div className={styles.metricTrend}>
                    {getTrendIcon(87, 82)}
                    <span>+5 points</span>
                  </div>
                  <div className={styles.metricDescription}>
                    Likelihood of AI systems citing your content
                  </div>
                </div>

                                 <div className={styles.metricCard}>
                   <div className={styles.metricHeader}>
                     <FaCrosshairs className={styles.metricIcon} />
                     <span className={styles.metricLabel}>Authority Score</span>
                   </div>
                  <div className={styles.metricValue}>
                    {metrics?.llmSeoMetrics?.authorityScore || 0}
                    <span className={styles.metricUnit}>/100</span>
                  </div>
                  <div className={styles.metricTrend}>
                    {getTrendIcon(85, 80)}
                    <span>+5 points</span>
                  </div>
                  <div className={styles.metricDescription}>
                    Recognition as authoritative source by AI
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <FaSearch className={styles.metricIcon} />
                    <span className={styles.metricLabel}>Knowledge Graph</span>
                  </div>
                  <div className={styles.metricValue}>
                    {metrics?.aiSearchOptimization?.knowledgeGraphCompatibility?.score || 0}
                    <span className={styles.metricUnit}>/100</span>
                  </div>
                  <div className={styles.metricTrend}>
                    {getTrendIcon(85, 78)}
                    <span>+7 points</span>
                  </div>
                  <div className={styles.metricDescription}>
                    Compatibility with AI knowledge structures
                  </div>
                </div>

                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <FaBullseye className={styles.metricIcon} />
                    <span className={styles.metricLabel}>Competitive Position</span>
                  </div>
                  <div className={styles.metricValue}>
                    {metrics?.llmSeoMetrics?.competitivePosition || 'competitive'}
                  </div>
                  <div className={styles.metricTrend}>
                    <FaArrowUp className={styles.trendUp} />
                    <span>Leading</span>
                  </div>
                  <div className={styles.metricDescription}>
                    Position relative to competitors in AI search
                  </div>
                </div>
              </div>
            </section>

            {/* Score Breakdown */}
            <section className={styles.scoreBreakdown}>
              <h2 className={styles.sectionTitle}>
                <FaChartBar className={styles.icon} />
                LLM Citation Score Breakdown
              </h2>
              <div className={styles.breakdownGrid}>
                {metrics?.llmCitationScore?.breakdown && Object.entries(metrics.llmCitationScore.breakdown).map(([key, value]) => (
                  <div key={key} className={styles.breakdownCard}>
                    <div className={styles.breakdownHeader}>
                      <span className={styles.breakdownLabel}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className={styles.breakdownScore} style={{ color: getScoreColor(value) }}>
                        {value}
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ 
                          width: `${value}%`, 
                          backgroundColor: getScoreColor(value) 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section className={styles.quickActions}>
              <h2 className={styles.sectionTitle}>
                <FaRocket className={styles.icon} />
                Quick Actions
              </h2>
              <div className={styles.actionsGrid}>
                <button className={styles.actionButton}>
                  <FaPenFancy className={styles.icon} />
                  Optimize Content
                </button>
                <button className={styles.actionButton}>
                  <FaSearch className={styles.icon} />
                  Analyze Queries
                </button>
                <button className={styles.actionButton}>
                  <FaUsers className={styles.icon} />
                  Competitor Analysis
                </button>
                <button className={styles.actionButton}>
                  <FaChartLine className={styles.icon} />
                  View Trends
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className={styles.metrics}>
            {/* AI Search Optimization */}
            <section className={styles.metricsSection}>
              <h2 className={styles.sectionTitle}>
                <FaSearch className={styles.icon} />
                AI Search Optimization
              </h2>
              <div className={styles.metricsGrid}>
                <div className={styles.detailedMetricCard}>
                  <h3>Knowledge Graph Compatibility</h3>
                  <div className={styles.metricScore}>
                    <span className={styles.score}>{metrics?.aiSearchOptimization?.knowledgeGraphCompatibility?.score || 0}</span>
                    <span className={styles.maxScore}>/100</span>
                  </div>
                  <div className={styles.metricDetails}>
                    <h4>Recognized Entities:</h4>
                    <div className={styles.entityTags}>
                      {metrics?.aiSearchOptimization?.knowledgeGraphCompatibility?.entityRecognition?.map((entity, index) => (
                        <span key={index} className={styles.entityTag}>{entity}</span>
                      ))}
                    </div>
                    <h4>Improvement Areas:</h4>
                    <ul>
                      {metrics?.aiSearchOptimization?.knowledgeGraphCompatibility?.improvementAreas?.map((area, index) => (
                        <li key={index}>{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className={styles.detailedMetricCard}>
                  <h3>Semantic Understanding</h3>
                  <div className={styles.metricScore}>
                    <span className={styles.score}>{metrics?.aiSearchOptimization?.semanticUnderstanding?.score || 0}</span>
                    <span className={styles.maxScore}>/100</span>
                  </div>
                  <div className={styles.metricDetails}>
                    <h4>Language Patterns:</h4>
                    <div className={styles.patternTags}>
                      {metrics?.aiSearchOptimization?.semanticUnderstanding?.languagePatterns?.map((pattern, index) => (
                        <span key={index} className={styles.patternTag}>{pattern}</span>
                      ))}
                    </div>
                    <h4>Authority Signals:</h4>
                    <ul>
                      {metrics?.aiSearchOptimization?.semanticUnderstanding?.authoritySignals?.map((signal, index) => (
                        <li key={index}>{signal}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className={styles.detailedMetricCard}>
                  <h3>Query Matching</h3>
                  <div className={styles.metricScore}>
                    <span className={styles.score}>{metrics?.aiSearchOptimization?.queryMatching?.score || 0}</span>
                    <span className={styles.maxScore}>/100</span>
                  </div>
                  <div className={styles.metricDetails}>
                    <h4>Covered Queries:</h4>
                    <ul>
                      {metrics?.aiSearchOptimization?.queryMatching?.coveredQueries?.map((query, index) => (
                        <li key={index}>{query}</li>
                      ))}
                    </ul>
                    <h4>Query Gaps:</h4>
                    <ul>
                      {metrics?.aiSearchOptimization?.queryMatching?.queryGaps?.map((gap, index) => (
                        <li key={index}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className={styles.recommendations}>
            <section className={styles.recommendationsSection}>
              <h2 className={styles.sectionTitle}>
                <FaLightbulb className={styles.icon} />
                LLM Optimization Recommendations
              </h2>
              
              {/* Critical Recommendations */}
              <div className={styles.recommendationGroup}>
                <h3 className={styles.recommendationTitle}>
                  <FaExclamationTriangle className={styles.icon} />
                  Critical Actions
                </h3>
                <div className={styles.recommendationsList}>
                  {metrics?.llmOptimizationRecommendations?.critical?.map((rec, index) => (
                    <div key={index} className={styles.recommendationCard}>
                      <div className={styles.recommendationHeader}>
                        <span className={styles.recommendationText}>{rec.recommendation}</span>
                        <div className={styles.recommendationMeta}>
                          <span className={`${styles.impact} ${styles[rec.impact]}`}>
                            {rec.impact} impact
                          </span>
                          <span className={`${styles.effort} ${styles[rec.effort]}`}>
                            {rec.effort} effort
                          </span>
                        </div>
                      </div>
                      <div className={styles.llmBenefit}>
                        <FaBrain className={styles.icon} />
                        {rec.llmBenefit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* High Priority Recommendations */}
                             <div className={styles.recommendationGroup}>
                 <h3 className={styles.recommendationTitle}>
                   <FaCrosshairs className={styles.icon} />
                   High Priority Actions
                 </h3>
                <div className={styles.recommendationsList}>
                  {metrics?.llmOptimizationRecommendations?.highPriority?.map((rec, index) => (
                    <div key={index} className={styles.recommendationCard}>
                      <div className={styles.recommendationHeader}>
                        <span className={styles.recommendationText}>{rec.recommendation}</span>
                        <div className={styles.recommendationMeta}>
                          <span className={`${styles.impact} ${styles[rec.impact]}`}>
                            {rec.impact} impact
                          </span>
                          <span className={`${styles.effort} ${styles[rec.effort]}`}>
                            {rec.effort} effort
                          </span>
                        </div>
                      </div>
                      <div className={styles.llmBenefit}>
                        <FaBrain className={styles.icon} />
                        {rec.llmBenefit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className={styles.optimization}>
            <section className={styles.optimizationSection}>
              <h2 className={styles.sectionTitle}>
                <FaCog className={styles.icon} />
                Content Optimization Tools
              </h2>
              <div className={styles.optimizationGrid}>
                <div className={styles.optimizationCard}>
                  <FaPenFancy className={styles.cardIcon} />
                  <h3>Content Rewriter</h3>
                  <p>Optimize your content specifically for LLM citation and AI search</p>
                  <button className={styles.optimizationButton}>
                    Start Rewriting
                  </button>
                </div>

                <div className={styles.optimizationCard}>
                  <FaSearch className={styles.cardIcon} />
                  <h3>Query Optimizer</h3>
                  <p>Analyze and optimize search queries for better LLM processing</p>
                  <button className={styles.optimizationButton}>
                    Optimize Queries
                  </button>
                </div>

                <div className={styles.optimizationCard}>
                  <FaUsers className={styles.cardIcon} />
                  <h3>Competitor Analysis</h3>
                  <p>Compare your content's LLM citability against competitors</p>
                  <button className={styles.optimizationButton}>
                    Analyze Competitors
                  </button>
                </div>

                <div className={styles.optimizationCard}>
                  <FaChartLine className={styles.cardIcon} />
                  <h3>Trend Analysis</h3>
                  <p>Identify emerging trends with high LLM citation potential</p>
                  <button className={styles.optimizationButton}>
                    View Trends
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
} 
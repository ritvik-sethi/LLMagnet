'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaSearch, 
  FaPlus, 
  FaTrash, 
  FaChartLine, 
  FaTrophy, 
  FaQuoteLeft, 
  FaInfoCircle, 
  FaLightbulb, 
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaCog,
  FaRocket,
  FaStar,
  FaThumbsUp,
  FaThumbsDown,
  FaClock,
  FaUser,
  FaUsers,
  FaGlobe,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaHeart,
  FaBookmark,
  FaShare,
  FaComment,
  FaRetweet,
  FaSmile,
  FaFrown,
  FaMeh,
  FaGrin,
  FaLaugh,
  FaSurprise,
  FaAngry,
  FaSadTear,
  FaTired,
  FaDizzy,
  FaFlushed,
  FaGrimace,
  FaGrinSquint,
  FaGrinSquintTears,
  FaGrinStars,
  FaGrinTears,
  FaGrinTongue,
  FaGrinTongueSquint,
  FaGrinTongueWink,
  FaGrinWink,
  FaKiss,
  FaKissWinkHeart,
  FaLaughSquint,
  FaLaughWink,
  FaSadCry,
  FaMinus,
  FaThLarge,
  FaChartBar,
  FaFileAlt,
  FaBrain
} from 'react-icons/fa';
import styles from '@/styles/CompetitorAnalysis.module.scss';
import AISparkleLoader from '@/components/AISparkleLoader';
import {
  setUserArticle,
  addCompetitor,
  removeCompetitor,
  updateCompetitor,
  addQuery,
  removeQuery,
  setAnalysisResults,
  setError,
  setLoading,
  reset
} from '@/store/slices/competitorAnalysisSlice';
import type { RootState } from '@/store/store';



// Type definitions
interface Recommendation {
  action?: string;
  goal?: string;
  strategy?: string;
  impact?: string;
  llmBenefit?: string;
  expectedOutcome?: string;
  llmCitabilityImpact?: string;
  implementation?: string;
}


// Score Card Component with Context
const ScoreCard = ({ title, score, maxScore = 100, icon, color = 'primary', trend = null, description }: {
  title: string;
  score: number;
  maxScore?: number;
  icon: React.ReactNode;
  color?: string;
  trend?: number | null;
  description?: string;
}) => {
  // Get context description for each metric
  const getContextDescription = (metricTitle: string) => {
    const descriptions: { [key: string]: string } = {
      'Citation Potential': 'How likely LLMs are to cite your content versus competitor alternatives.',
      'Factual Accuracy': 'Evaluates verifiability and reliability of claims compared to competing content.',
      'Authority Signals': 'Assesses expertise demonstration and credibility indicators versus competitors.',
      'Information Density': 'Measures depth and comprehensiveness compared to alternative content sources.',
      'Structural Accessibility': 'How easily AI systems can parse and understand your content structure.',
      'Citation Likelihood': 'Probability that your content will be cited by LLMs when answering relevant queries.',
      'Authority Score': 'Overall authority and credibility assessment compared to competitors.',
      'Information Value': 'Quantifies the practical value and usefulness of information provided.',
      'Structural Optimization': 'How well your content is structured for AI processing and citation extraction.',
      'Competitive Position': 'Your content ranking relative to competitors in AI search and citation results.'
    };
    return descriptions[metricTitle] || description || '';
  };

  return (
    <div className={`${styles.scoreCard} ${styles[color]}`}>
      <div className={styles.scoreHeader}>
        {icon}
        <h3>{title}</h3>
        {getContextDescription(title) && (
          <div className={styles.contextTooltip}>
            <FaInfoCircle className={styles.tooltipIcon} />
            <span className={styles.tooltipText}>{getContextDescription(title)}</span>
          </div>
        )}
      </div>
      <div className={styles.scoreValue}>
        <span className={styles.scoreNumber}>{score}</span>
        <span className={styles.scoreMax}>/ {maxScore}</span>
        {trend !== null && (
          <span className={`${styles.trend} ${trend > 0 ? styles.positive : styles.negative}`}>
            {trend > 0 ? <FaArrowUp /> : <FaArrowDown />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={styles.scoreBar}>
        <div 
          className={styles.scoreFill} 
          style={{ width: `${(score / maxScore) * 100}%` }}
        />
      </div>
      {description && (
        <p className={styles.description}>{description}</p>
      )}
    </div>
  );
};

// Comparison Chart Component
const ComparisonChart = ({ data, title, description }: {
  data: { yourContent: number; competitorContent: number };
  title: string;
  description?: string;
}) => {
  // Get context description for comparison metrics
  const getComparisonDescription = (metricTitle: string) => {
    const descriptions: { [key: string]: string } = {
      'Overall LLM Score': 'Overall assessment of how well your content performs against competitors in terms of LLM citability and AI search optimization.',
      'Structural Accessibility': 'Measures how easy it is for AI systems to parse, understand, and extract information from your content structure.',
      'Citation Potential': 'How likely LLMs are to cite your content versus competitor alternatives.',
      'Factual Accuracy': 'Evaluates verifiability and reliability of claims compared to competing content.',
      'Authority Signals': 'Assesses expertise demonstration and credibility indicators versus competitors.',
      'Information Density': 'Measures depth and comprehensiveness compared to alternative content sources.'
    };
    return descriptions[metricTitle] || description || '';
  };

  const difference = data.yourContent - data.competitorContent;
  const isLeading = difference > 0;
  const isTied = difference === 0;

  return (
    <div className={styles.comparisonChart}>
      <h3 className={styles.chartTitle}>
        {title}
        {getComparisonDescription(title) && (
          <div className={styles.contextTooltip}>
            <FaInfoCircle className={styles.tooltipIcon} />
            <span className={styles.tooltipText}>{getComparisonDescription(title)}</span>
          </div>
        )}
      </h3>
      <div className={styles.chartContent}>
        <div className={styles.barContainer}>
          <div className={styles.barLabel}>Your Content</div>
          <div className={styles.barWrapper}>
            <div 
              className={`${styles.bar} ${styles.yourContent}`}
              style={{ width: `${data.yourContent}%` }}
            >
              <span className={styles.barValue}>{data.yourContent}%</span>
            </div>
          </div>
        </div>
        <div className={styles.barContainer}>
          <div className={styles.barLabel}>Competitor</div>
          <div className={styles.barWrapper}>
            <div 
              className={`${styles.bar} ${styles.competitorContent}`}
              style={{ width: `${data.competitorContent}%` }}
            >
              <span className={styles.barValue}>{data.competitorContent}%</span>
            </div>
          </div>
        </div>
      </div>
      <div className={`${styles.comparisonResult} ${isLeading ? styles.leading : isTied ? styles.tied : styles.lagging}`}>
        {isLeading && <FaArrowUp className={styles.icon} />}
        {isTied && <FaMinus className={styles.icon} />}
        {!isLeading && !isTied && <FaArrowDown className={styles.icon} />}
        <span>
          {isLeading && `Leading by ${Math.abs(difference)}%`}
          {isTied && 'Tied with competitor'}
          {!isLeading && !isTied && `Lagging by ${Math.abs(difference)}%`}
        </span>
      </div>
    </div>
  );
};

// Recommendation Card Component
const RecommendationCard = ({ recommendation, type }: {
  recommendation: Recommendation;
  type: string;
}) => (
  <div className={`${styles.recommendationCard} ${styles[type]}`}>
    <div className={styles.recommendationHeader}>
      <div className={styles.recommendationIcon}>
        {type === 'immediate' && <FaThLarge />}
        {type === 'shortTerm' && <FaLightbulb />}
        {type === 'longTerm' && <FaTrophy />}
      </div>
      <div className={styles.recommendationMeta}>
        <span className={styles.recommendationType}>
          {type === 'immediate' ? 'Immediate Action' : 
           type === 'shortTerm' ? 'Short Term Goal' : 'Long Term Strategy'}
        </span>
        {recommendation.impact && (
          <span className={`${styles.impact} ${styles[recommendation.impact]}`}>
            {recommendation.impact} impact
          </span>
        )}
      </div>
    </div>
    <h4>{recommendation.action || recommendation.goal || recommendation.strategy}</h4>
    <p>{recommendation.llmBenefit || recommendation.expectedOutcome || recommendation.llmCitabilityImpact}</p>
    {recommendation.implementation && (
      <div className={styles.implementation}>
        <strong>Implementation:</strong> {recommendation.implementation}
      </div>
    )}
  </div>
);

// Context Information Component
const ContextInfo = ({ title, description }: { title: string; description: string }) => (
  <div className={styles.contextInfo}>
    <h4>{title}</h4>
    <p>{description}</p>
  </div>
);

export default function CompetitorAnalysis() {
  const dispatch = useDispatch();
  const {
    userArticle,
    competitors,
    targetQueries,
    loading,
    error,
    analysisResults,
  } = useSelector((state: RootState) => state.competitorAnalysis);

  const [newQuery, setNewQuery] = useState('');

  const handleUserArticleChange = (field: 'title' | 'content', value: string) => {
    dispatch(setUserArticle({ ...userArticle, [field]: value }));
  };

  const handleAddCompetitor = () => {
    if (competitors.length < 3) {
      dispatch(addCompetitor());
    }
  };

  const handleRemoveCompetitor = (index: number) => {
    dispatch(removeCompetitor(index));
  };

  const handleCompetitorChange = (index: number, field: 'title' | 'content', value: string) => {
    dispatch(updateCompetitor({ index, field, value }));
  };

  const handleAddQuery = () => {
    if (newQuery.trim() && !targetQueries.includes(newQuery.trim())) {
      dispatch(addQuery(newQuery.trim()));
      setNewQuery('');
    }
  };

  const handleRemoveQuery = (query: string) => {
    dispatch(removeQuery(query));
  };

  const handleAnalyze = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response = await fetch('/api/competitor-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yourContent: userArticle.content,
          competitorContent: competitors[0]?.content || '',
          keywords: targetQueries,
          marketPosition: 'competitive',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const results = await response.json();
      dispatch(setAnalysisResults(results));
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'An error occurred'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRewrite = () => {
    window.location.href = '/rewrite-for-llm';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <FaChartBar className={styles.icon} />
          LLM Competitor Analysis
        </h1>
        <p className={styles.subtitle}>
          Analyze your content&apos;s LLM citability potential against competitors using advanced AI metrics.
        </p>
        <div className={styles.headerContext}>
          <ContextInfo 
            title="What is LLM Citability Analysis?"
            description="This tool analyzes how likely large language models (like ChatGPT, Gemini, Claude) are to cite your content when answering user queries. It evaluates factual accuracy, authority signals, and information density to help you optimize for AI search visibility."
          />
        </div>
      </header>

      <div className={styles.articlesGrid}>
        <section className={styles.inputSection}>
          <h2 className={styles.sectionTitle}>
            <FaFileAlt className={styles.icon} />
            Your Content
          </h2>
          <div className={styles.inputGroup}>
            <label>
              <FaFileAlt className={styles.icon} />
              Content Title
            </label>
            <input
              type="text"
              value={userArticle.title}
              onChange={(e) => handleUserArticleChange('title', e.target.value)}
              placeholder="Enter your content title"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>
              <FaFileAlt className={styles.icon} />
              Content
            </label>
            <textarea
              value={userArticle.content}
              onChange={(e) => handleUserArticleChange('content', e.target.value)}
              placeholder="Paste your content here"
            />
          </div>
        </section>

        <section className={styles.competitorSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.title}>
              <FaFileAlt className={styles.icon} />
              Competitor Content
            </h2>
            {competitors.length < 3 && (
              <button className={styles.addButton} onClick={handleAddCompetitor}>
                <FaPlus /> Add Competitor
              </button>
            )}
          </div>
          <div className={styles.competitorList}>
            {competitors.map((competitor, index) => (
              <div key={index} className={styles.competitorCard}>
                <button
                  className={styles.removeButton}
                  onClick={() => handleRemoveCompetitor(index)}
                >
                  <FaTrash />
                </button>
                <div className={styles.inputGroup}>
                  <label>
                    <FaFileAlt className={styles.icon} />
                    Content Title
                  </label>
                  <input
                    type="text"
                    value={competitor.title}
                    onChange={(e) => handleCompetitorChange(index, 'title', e.target.value)}
                    placeholder="Enter competitor content title"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>
                    <FaFileAlt className={styles.icon} />
                    Content
                  </label>
                  <textarea
                    value={competitor.content}
                    onChange={(e) => handleCompetitorChange(index, 'content', e.target.value)}
                    placeholder="Paste competitor content here"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.queriesSection}>
        <h2 className={styles.sectionTitle}>
          <FaSearch className={styles.icon} />
          Target Keywords
        </h2>
        <div className={styles.queryList}>
          {targetQueries.map((query) => (
            <div key={query} className={styles.queryChip}>
              {query}
              <button
                className={styles.removeButton}
                onClick={() => handleRemoveQuery(query)}
              >
                <FaTimes />
              </button>
            </div>
          ))}
          <div className={styles.queryInput}>
            <input
              type="text"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              placeholder="Add a target keyword"
              onKeyPress={(e) => e.key === 'Enter' && handleAddQuery()}
            />
            <button
              className={styles.addButton}
              onClick={handleAddQuery}
              disabled={!newQuery.trim()}
            >
              <FaPlus />
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <p>Analyzing your content with AI...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <FaExclamationTriangle className={styles.icon} />
          {error}
        </div>
      ) : analysisResults ? (
        <div className={styles.resultsContainer}>
          {/* LLM Citability Scores */}
          <section className={styles.scoresSection}>
            <h2 className={styles.sectionTitle}>
              <FaBrain className={styles.icon} />
              LLM Citability Analysis
            </h2>
            <div className={styles.scoresGrid}>
              <ScoreCard
                title="Citation Potential"
                score={analysisResults.llmCitabilityAnalysis?.yourContentScore?.citationPotential || 0}
                icon={<FaQuoteLeft />}
                color="primary"
                description="Measures how likely LLMs are to cite your content when answering queries. Higher scores indicate content that's more quotable and authoritative."
              />
              <ScoreCard
                title="Factual Accuracy"
                score={analysisResults.llmCitabilityAnalysis?.yourContentScore?.factualAccuracy || 0}
                icon={<FaCheck />}
                color="success"
                description="Evaluates the verifiability and reliability of factual claims in your content. LLMs prefer content with strong factual backing."
              />
              <ScoreCard
                title="Authority Signals"
                score={analysisResults.llmCitabilityAnalysis?.yourContentScore?.authoritySignals || 0}
                icon={<FaTrophy />}
                color="warning"
                description="Assesses how well your content demonstrates expertise and credibility. Includes author credentials, source citations, and domain authority."
              />
              <ScoreCard
                title="Information Density"
                score={analysisResults.llmCitabilityAnalysis?.yourContentScore?.informationDensity || 0}
                icon={<FaInfoCircle />}
                color="info"
                description="Measures the depth and comprehensiveness of information provided. LLMs value content that offers substantial, valuable insights."
              />
            </div>
          </section>

          {/* Competitive Comparison */}
          <section className={styles.comparisonSection}>
            <h2 className={styles.sectionTitle}>
              <FaChartBar className={styles.icon} />
              Competitive Comparison
            </h2>
            <div className={styles.comparisonGrid}>
              <ComparisonChart
                title="Overall LLM Score"
                data={{
                  yourContent: analysisResults.llmCitabilityAnalysis?.yourContentScore?.overallScore || 0,
                  competitorContent: analysisResults.llmCitabilityAnalysis?.competitorContentScore?.overallScore || 0
                }}
                description="Overall assessment of how well your content performs against competitors in terms of LLM citability and AI search optimization."
              />
              <ComparisonChart
                title="Structural Accessibility"
                data={{
                  yourContent: analysisResults.llmCitabilityAnalysis?.yourContentScore?.structuralAccessibility || 0,
                  competitorContent: analysisResults.llmCitabilityAnalysis?.competitorContentScore?.structuralAccessibility || 0
                }}
                description="Measures how easy it is for AI systems to parse, understand, and extract information from your content structure."
              />
            </div>
          </section>

          {/* Competitive Advantages */}
          <section className={styles.advantagesSection}>
            <h2 className={styles.sectionTitle}>
              <FaLightbulb className={styles.icon} />
              Your Competitive Advantages
            </h2>
            <div className={styles.advantagesGrid}>
              {analysisResults.llmCitabilityAnalysis?.competitiveAdvantage?.yourStrengths?.map((strength: string, index: number) => (
                <div key={index} className={styles.advantageCard}>
                  <FaCheck className={styles.icon} />
                  <p>{strength}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Citation Opportunities */}
          <section className={styles.opportunitiesSection}>
            <h2 className={styles.sectionTitle}>
              <FaQuoteLeft className={styles.icon} />
              Citation Opportunities
            </h2>
            <div className={styles.opportunitiesGrid}>
              <div className={styles.opportunityColumn}>
                <h3>Quote-Worthy Statements</h3>
                <div className={styles.opportunityList}>
                  {analysisResults.llmCitationOpportunities?.quoteWorthyStatements?.yourContent?.map((statement: string, index: number) => (
                    <div key={index} className={styles.opportunityItem}>
                      <FaQuoteLeft className={styles.icon} />
                      <p>{statement}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.opportunityColumn}>
                <h3>Missing Opportunities</h3>
                <div className={styles.opportunityList}>
                  {analysisResults.llmCitationOpportunities?.quoteWorthyStatements?.missingOpportunities?.map((opportunity: string, index: number) => (
                    <div key={index} className={styles.opportunityItem}>
                      <FaTimes className={styles.icon} />
                      <p>{opportunity}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Strategic Recommendations */}
          <section className={styles.recommendationsSection}>
            <h2 className={styles.sectionTitle}>
              <FaThLarge className={styles.icon} />
              Strategic Recommendations
            </h2>
            <div className={styles.recommendationsGrid}>
              <div className={styles.recommendationColumn}>
                <h3>Immediate Actions</h3>
                {analysisResults.strategicRecommendations?.immediateActions?.map((action: Recommendation, index: number) => (
                  <RecommendationCard key={index} recommendation={action} type="immediate" />
                ))}
              </div>
              <div className={styles.recommendationColumn}>
                <h3>Short Term Goals</h3>
                {analysisResults.strategicRecommendations?.shortTermGoals?.map((goal: Recommendation, index: number) => (
                  <RecommendationCard key={index} recommendation={goal} type="shortTerm" />
                ))}
              </div>
              <div className={styles.recommendationColumn}>
                <h3>Long Term Strategy</h3>
                {analysisResults.strategicRecommendations?.longTermStrategy?.map((strategy: Recommendation, index: number) => (
                  <RecommendationCard key={index} recommendation={strategy} type="longTerm" />
                ))}
              </div>
            </div>
          </section>

          {/* LLM SEO Metrics */}
          <section className={styles.metricsSection}>
            <h2 className={styles.sectionTitle}>
              <FaBrain className={styles.icon} />
              LLM SEO Metrics
            </h2>
            <div className={styles.metricsGrid}>
              <ScoreCard
                title="Citation Likelihood"
                score={analysisResults.llmSeoMetrics?.citationLikelihood || 0}
                icon={<FaQuoteLeft />}
                color="primary"
                description="Probability that your content will be cited by LLMs when answering relevant queries. Higher scores increase AI search visibility."
              />
              <ScoreCard
                title="Authority Score"
                score={analysisResults.llmSeoMetrics?.authorityScore || 0}
                icon={<FaTrophy />}
                color="warning"
                description="Overall authority and credibility assessment. Influences how LLMs perceive and rank your content's reliability."
              />
              <ScoreCard
                title="Information Value"
                score={analysisResults.llmSeoMetrics?.informationValue || 0}
                icon={<FaInfoCircle />}
                color="info"
                description="Quantifies the practical value and usefulness of information provided. LLMs prefer content with high information value."
              />
              <ScoreCard
                title="Structural Optimization"
                score={analysisResults.llmSeoMetrics?.structuralOptimization || 0}
                icon={<FaChartBar />}
                color="success"
                description="How well your content is structured for AI processing. Includes headings, formatting, and logical organization."
              />
            </div>
            <div className={styles.competitivePosition}>
              <h3>Competitive Position</h3>
              <div className={`${styles.positionBadge} ${styles[analysisResults.llmSeoMetrics?.competitivePosition || 'competitive']}`}>
                {analysisResults.llmSeoMetrics?.competitivePosition || 'competitive'}
              </div>
              <p className={styles.positionDescription}>
                {analysisResults.llmSeoMetrics?.competitivePosition === 'leading' && 
                  "Your content is performing exceptionally well and likely to be prioritized by LLMs."}
                {analysisResults.llmSeoMetrics?.competitivePosition === 'competitive' && 
                  "Your content is on par with competitors but has room for improvement."}
                {analysisResults.llmSeoMetrics?.competitivePosition === 'lagging' && 
                  "Your content needs significant improvements to compete effectively in AI search."}
              </p>
            </div>
          </section>

          {/* Key Insights Summary */}
          <section className={styles.insightsSection}>
            <h2 className={styles.sectionTitle}>
              <FaLightbulb className={styles.icon} />
              Key Insights Summary
            </h2>
            <div className={styles.insightsGrid}>
              <div className={styles.insightCard}>
                <h4>🎯 Primary Focus Areas</h4>
                <ul>
                  {analysisResults.contentGaps?.missingFactualClaims?.slice(0, 3).map((gap: string, index: number) => (
                    <li key={index}>{gap}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.insightCard}>
                <h4>📈 Quick Wins</h4>
                <ul>
                  {analysisResults.strategicRecommendations?.immediateActions?.slice(0, 3).map((action: Recommendation, index: number) => (
                    <li key={index}>{action.action}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.insightCard}>
                <h4>🔍 AI Search Optimization</h4>
                <ul>
                  {analysisResults.aiSearchOptimization?.knowledgeGraphCompatibility?.improvementAreas?.slice(0, 3).map((area: string, index: number) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <section className={styles.actionsSection}>
        <button
          className={styles.analyzeButton}
          onClick={handleAnalyze}
          disabled={loading || !userArticle.content || competitors.length === 0}
        >
          {loading ? 'Analyzing...' : 'Analyze Content'}
        </button>
        {analysisResults && (
          <button className={styles.rewriteButton} onClick={handleRewrite}>
            Optimize Content
          </button>
        )}
      </section>

      {/* AI Sparkle Loader */}
      <AISparkleLoader isLoading={loading} />
    </div>
  );
} 
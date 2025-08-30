'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaFileAlt, 
  FaTrash, 
  FaRocket, 
  FaRobot, 
  FaTools, 
  FaTimes, 
  FaCheck, 
  FaExclamationTriangle,
  FaQuoteLeft,
  FaBrain,
  FaLightbulb,
  FaThLarge,
  FaTrophy,
  FaArrowUp,
  FaArrowDown,
  FaInfoCircle,
  FaChartBar,
  FaSearch,
  FaCog
} from 'react-icons/fa';
import styles from '@/styles/ContentScore.module.scss';
import AISparkleLoader from '@/components/AISparkleLoader';
import {
  setHeadingText,
  setInputText,
  clearHeading,
  clearInput,
  evaluateContent,
  evaluationComplete
} from '@/store/slices/contentScoreSlice';
import type { RootState } from '@/store/store';

// Score Card Component
const ScoreCard = ({ title, score, maxScore = 100, icon, color = 'primary', reasoning = '' }: {
  title: string;
  score: number;
  maxScore?: number;
  icon: React.ReactNode;
  color?: string;
  reasoning?: string;
}) => {
  // Get context description for each metric
  const getContextDescription = (metricTitle: string) => {
    const descriptions: { [key: string]: string } = {
      'LLM Citation Potential': 'How likely AI systems will quote your content directly when answering user queries.',
      'Factual Authority': 'Content expertise demonstration and claim supportability for AI credibility recognition.',
      'Information Density': 'Depth and comprehensiveness of valuable information that LLMs find worth citing.',
      'Structural Accessibility': 'How easily AI systems can parse, extract, and understand your content organization.',
      'Heading Optimization': 'Title likelihood of being selected by LLMs when answering related queries.',
      'Source Credibility': 'Content trustworthiness and authority indicators that AI systems recognize.',
      'Knowledge Graph Compatibility': 'How well content aligns with AI knowledge structures and entity recognition systems.',
      'Semantic Understanding': 'How effectively content uses language patterns that LLMs recognize as authoritative.',
      'Query Matching': 'How well content answers common user questions that trigger AI citation behavior.',
      'Citation Likelihood': 'Probability that LLMs like ChatGPT will cite your content as a source in responses.',
      'Authority Score': 'How AI systems perceive your content expertise and credibility levels.',
      'Information Value': 'Quantifies the practical usefulness and depth of information provided to AI systems.',
      'Structural Optimization': 'How well content is organized for AI processing and citation extraction.'
    };
    return descriptions[metricTitle] || '';
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
      </div>
      <div className={styles.scoreBar}>
        <div 
          className={styles.scoreFill} 
          style={{ width: `${(score / maxScore) * 100}%` }}
        />
      </div>
      {reasoning && (
        <p className={styles.reasoning}>{reasoning}</p>
      )}
    </div>
  );
};

// Breakdown Section Component
const BreakdownSection = ({ title, breakdown, icon }: {
  title: string;
  breakdown: any;
  icon: React.ReactNode;
}) => {
  // Get context description for breakdown fields
  const getBreakdownDescription = (fieldName: string) => {
    const descriptions: { [key: string]: string } = {
      'llmCitationPotential': 'How likely AI systems will quote your content directly when answering user queries.',
      'factualAuthority': 'Content expertise demonstration and claim supportability for AI credibility recognition.',
      'informationDensity': 'Depth and comprehensiveness of valuable information that LLMs find worth citing.',
      'structuralAccessibility': 'How easily AI systems can parse, extract, and understand your content organization.',
      'headingOptimization': 'Title likelihood of being selected by LLMs when answering related queries.',
      'sourceCredibility': 'Content trustworthiness and authority indicators that AI systems recognize.'
    };
    return descriptions[fieldName] || '';
  };

  return (
    <section className={styles.breakdownSection}>
      <h2 className={styles.sectionTitle}>
        {icon}
        {title}
      </h2>
      <div className={styles.breakdownGrid}>
        {Object.entries(breakdown).map(([key, value]: [string, any]) => (
          <div key={key} className={styles.breakdownCard}>
            <h3 className={styles.breakdownTitle}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              {getBreakdownDescription(key) && (
                <div className={styles.contextTooltip}>
                  <FaInfoCircle className={styles.tooltipIcon} />
                  <span className={styles.tooltipText}>{getBreakdownDescription(key)}</span>
                </div>
              )}
            </h3>
            <div className={styles.breakdownScore}>
              <span className={styles.scoreNumber}>{value.score || 0}</span>
              <span className={styles.scoreMax}>/ {getMaxScore(key)}</span>
            </div>
            <div className={styles.scoreBar}>
              <div 
                className={styles.scoreFill} 
                style={{ width: `${((value.score || 0) / getMaxScore(key)) * 100}%` }}
              />
            </div>
            {value.reasoning && (
              <p className={styles.reasoning}>{value.reasoning}</p>
            )}
            {value.citationStrengths && (
              <div className={styles.strengthsList}>
                <h4>Strengths:</h4>
                <ul>
                  {value.citationStrengths.map((strength: string, index: number) => (
                    <li key={index}><FaCheck /> {strength}</li>
                  ))}
                </ul>
              </div>
            )}
            {value.citationWeaknesses && (
              <div className={styles.weaknessesList}>
                <h4>Areas for Improvement:</h4>
                <ul>
                  {value.citationWeaknesses.map((weakness: string, index: number) => (
                    <li key={index}><FaTimes /> {weakness}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

// Recommendation Card Component
const RecommendationCard = ({ recommendation, priority }: {
  recommendation: any;
  priority: string;
}) => (
  <div className={`${styles.recommendationCard} ${styles[priority]}`}>
    <div className={styles.recommendationHeader}>
      <div className={styles.recommendationIcon}>
        {priority === 'critical' && <FaExclamationTriangle />}
        {priority === 'highPriority' && <FaThLarge />}
        {priority === 'mediumPriority' && <FaLightbulb />}
      </div>
      <div className={styles.recommendationMeta}>
        <span className={styles.recommendationType}>
          {priority === 'critical' ? 'Critical' : 
           priority === 'highPriority' ? 'High Priority' : 'Medium Priority'}
        </span>
        {recommendation.impact && (
          <span className={`${styles.impact} ${styles[recommendation.impact]}`}>
            {recommendation.impact} impact
          </span>
        )}
      </div>
    </div>
    <h4>{recommendation.recommendation}</h4>
    <p>{recommendation.llmBenefit}</p>
    {recommendation.effort && (
      <div className={styles.effort}>
        <strong>Effort:</strong> {recommendation.effort}
      </div>
    )}
  </div>
);

// Helper function to get max score for different breakdown categories
const getMaxScore = (category: string) => {
  const maxScores: { [key: string]: number } = {
    llmCitationPotential: 25,
    factualAuthority: 20,
    informationDensity: 20,
    structuralAccessibility: 15,
    headingOptimization: 10,
    sourceCredibility: 10
  };
  return maxScores[category] || 100;
};

export default function ContentScore() {
  const dispatch = useDispatch();
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    headingText,
    inputText,
    isLoading,
    characterCount,
    headingCharacterCount
  } = useSelector((state: RootState) => state.contentScore);

  // Handle paste event for content only
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only handle paste if the target is the content textarea
      const target = e.target as HTMLElement;
      if (target.id === 'content-editor') {
        const pastedText = e.clipboardData?.getData('text');
        if (pastedText) {
          dispatch(setInputText(pastedText));
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [dispatch]);

  const handleEvaluate = async () => {
    try {
      setError(null);
      dispatch(evaluateContent());
      
      const response = await fetch('/api/content-seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metaTitle: headingText,
          content: inputText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const data = await response.json();
      setAnalysis(data);
      dispatch(evaluationComplete());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      dispatch(evaluationComplete());
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          <FaBrain className={styles.icon} />
          LLM Content SEO Analyzer
        </h1>
        <p className={styles.subtitle}>
          Analyze your content's LLM citability potential and AI search optimization readiness
        </p>
      </header>

      {/* Input Container */}
      <div className={styles.inputContainer}>
        {/* Heading Input */}
        <div className={styles.headingInput}>
          <label className={styles.headingLabel}>
            <FaFileAlt className={styles.icon} />
            Content Title
          </label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.headingField}
              value={headingText}
              onChange={(e) => dispatch(setHeadingText(e.target.value))}
              placeholder="Enter your content title..."
            />
            {headingText && (
              <button
                className={styles.clearButton}
                onClick={() => dispatch(clearHeading())}
                title="Clear heading"
              >
                <FaTimes />
              </button>
            )}
            <div className={styles.characterCount}>
              {headingCharacterCount}/100 characters
            </div>
          </div>
        </div>

        {/* Text Editor */}
        <div className={styles.editor}>
          <label className={styles.editorLabel}>
            <FaFileAlt className={styles.icon} />
            Content
          </label>
          <textarea
            id="content-editor"
            className={styles.textArea}
            value={inputText}
            onChange={(e) => dispatch(setInputText(e.target.value))}
            placeholder="Paste or write your content here..."
          />
          <div className={styles.characterCount}>
            {characterCount}/5000 characters
          </div>
          {inputText && (
            <button
              className={styles.clearButton}
              onClick={() => dispatch(clearInput())}
              title="Clear content"
            >
              <FaTrash />
            </button>
          )}
        </div>
      </div>

      {/* Evaluate Button */}
      <button
        className={styles.evaluateButton}
        onClick={handleEvaluate}
        disabled={!inputText.trim() || isLoading}
      >
        <FaRocket className={styles.icon} />
        {isLoading ? 'Analyzing...' : 'Analyze Content'}
      </button>

      {/* AI Sparkle Loader */}
      <AISparkleLoader isLoading={isLoading} />

      {/* Error Display */}
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle className={styles.icon} />
          {error}
        </div>
      )}

      {/* Results Section */}
      {analysis && (
        <div className={styles.results}>
          {/* Overall Score */}
          <section className={styles.overallScoreSection}>
            <h2 className={styles.sectionTitle}>
              <FaBrain className={styles.icon} />
              LLM Citation Score
            </h2>
            <div className={styles.overallScoreDisplay}>
              <div 
                className={styles.scoreCircle}
                style={{ '--score': `${analysis.llmCitationScore?.overallScore || 0}%` } as React.CSSProperties}
              >
                <div className={styles.scoreValue}>{analysis.llmCitationScore?.overallScore || 0}</div>
              </div>
              <div className={styles.scoreInfo}>
                <div className={styles.scoreLabel}>Overall LLM Citation Score</div>
                <div className={styles.scoreDetails}>
                  <div className={styles.scoreDetail}>
                    <span>Citation Likelihood:</span>
                    <span className={styles.badge}>
                      {analysis.llmCitationScore?.citationLikelihood || 'medium'}
                    </span>
                  </div>
                  <div className={styles.scoreDetail}>
                    <span>Confidence Level:</span>
                    <span className={styles.badge}>
                      {analysis.llmCitationScore?.confidenceLevel || 'medium'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Score Breakdown */}
          {analysis.llmCitationScore?.breakdown && (
            <BreakdownSection
              title="Score Breakdown"
              breakdown={analysis.llmCitationScore.breakdown}
              icon={<FaChartBar />}
            />
          )}

          {/* LLM SEO Analysis */}
          {analysis.llmSeoAnalysis && (
            <section className={styles.seoAnalysisSection}>
              <h2 className={styles.sectionTitle}>
                <FaRobot className={styles.icon} />
                LLM SEO Analysis
              </h2>
              
              {/* Citation Optimization */}
              {analysis.llmSeoAnalysis.citationOptimization && (
                <div className={styles.optimizationSection}>
                  <h3>Citation Optimization</h3>
                  <div className={styles.optimizationGrid}>
                    {analysis.llmSeoAnalysis.citationOptimization.quoteWorthyStatements && (
                      <div className={styles.optimizationCard}>
                        <h4>Quote-Worthy Statements</h4>
                        <div className={styles.statementList}>
                          {analysis.llmSeoAnalysis.citationOptimization.quoteWorthyStatements.map((statement: any, index: number) => (
                            <div key={index} className={styles.statementItem}>
                              <FaQuoteLeft className={styles.icon} />
                              <div className={styles.statementContent}>
                                <p>{statement.statement}</p>
                                <div className={styles.statementMeta}>
                                  <span>Value: {statement.citationValue}%</span>
                                  <span>Authority: {statement.authorityLevel}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Search Optimization */}
              {analysis.llmSeoAnalysis.aiSearchOptimization && (
                <div className={styles.optimizationSection}>
                  <h3>AI Search Optimization</h3>
                  <div className={styles.optimizationGrid}>
                    <ScoreCard
                      title="Knowledge Graph Compatibility"
                      score={analysis.llmSeoAnalysis.aiSearchOptimization.knowledgeGraphCompatibility?.score || 0}
                      icon={<FaSearch />}
                      color="info"
                    />
                    <ScoreCard
                      title="Semantic Understanding"
                      score={analysis.llmSeoAnalysis.aiSearchOptimization.semanticUnderstanding?.score || 0}
                      icon={<FaBrain />}
                      color="primary"
                    />
                    <ScoreCard
                      title="Query Matching"
                      score={analysis.llmSeoAnalysis.aiSearchOptimization.queryMatching?.score || 0}
                      icon={<FaThLarge />}
                      color="success"
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          {/* LLM SEO Metrics */}
          {analysis.llmSeoMetrics && (
            <section className={styles.metricsSection}>
              <h2 className={styles.sectionTitle}>
                <FaTrophy className={styles.icon} />
                LLM SEO Metrics
              </h2>
              <div className={styles.metricsGrid}>
                <ScoreCard
                  title="Citation Likelihood"
                  score={analysis.llmSeoMetrics.citationLikelihood || 0}
                  icon={<FaQuoteLeft />}
                  color="primary"
                />
                <ScoreCard
                  title="Authority Score"
                  score={analysis.llmSeoMetrics.authorityScore || 0}
                  icon={<FaTrophy />}
                  color="warning"
                />
                <ScoreCard
                  title="Information Value"
                  score={analysis.llmSeoMetrics.informationValue || 0}
                  icon={<FaInfoCircle />}
                  color="info"
                />
                <ScoreCard
                  title="Structural Optimization"
                  score={analysis.llmSeoMetrics.structuralOptimization || 0}
                  icon={<FaChartBar />}
                  color="success"
                />
              </div>
              <div className={styles.competitivePosition}>
                <h3>Competitive Position</h3>
                <div className={`${styles.positionBadge} ${styles[analysis.llmSeoMetrics.competitivePosition || 'competitive']}`}>
                  {analysis.llmSeoMetrics.competitivePosition || 'competitive'}
                </div>
              </div>
            </section>
          )}

          {/* Recommendations */}
          {analysis.llmOptimizationRecommendations && (
            <section className={styles.recommendationsSection}>
              <h2 className={styles.sectionTitle}>
                <FaTools className={styles.icon} />
                Optimization Recommendations
              </h2>
              <div className={styles.recommendationsGrid}>
                {analysis.llmOptimizationRecommendations.critical && (
                  <div className={styles.recommendationColumn}>
                    <h3>Critical Actions</h3>
                    {analysis.llmOptimizationRecommendations.critical.map((recommendation: any, index: number) => (
                      <RecommendationCard key={index} recommendation={recommendation} priority="critical" />
                    ))}
                  </div>
                )}
                {analysis.llmOptimizationRecommendations.highPriority && (
                  <div className={styles.recommendationColumn}>
                    <h3>High Priority</h3>
                    {analysis.llmOptimizationRecommendations.highPriority.map((recommendation: any, index: number) => (
                      <RecommendationCard key={index} recommendation={recommendation} priority="highPriority" />
                    ))}
                  </div>
                )}
                {analysis.llmOptimizationRecommendations.mediumPriority && (
                  <div className={styles.recommendationColumn}>
                    <h3>Medium Priority</h3>
                    {analysis.llmOptimizationRecommendations.mediumPriority.map((recommendation: any, index: number) => (
                      <RecommendationCard key={index} recommendation={recommendation} priority="mediumPriority" />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Citation Enhancement */}
          {analysis.citationEnhancement && (
            <section className={styles.enhancementSection}>
              <h2 className={styles.sectionTitle}>
                <FaCog className={styles.icon} />
                Citation Enhancement Opportunities
              </h2>
              <div className={styles.enhancementGrid}>
                {Object.entries(analysis.citationEnhancement).map(([key, value]: [string, any]) => (
                  <div key={key} className={styles.enhancementCard}>
                    <h3>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                    <ul>
                      {Array.isArray(value) && value.map((item: string, index: number) => (
                        <li key={index}><FaLightbulb /> {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
} 
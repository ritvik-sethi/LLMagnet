'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
  FaBrain, 
  FaCode, 
  FaTrash, 
  FaExclamationTriangle, 
  FaInfoCircle,
  FaCheck,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaArrowRight,
  FaLightbulb,
  FaChartBar,
  FaSearch,
  FaCog,
  FaRocket,
  FaEye,
  FaEyeSlash,
  FaClock
} from 'react-icons/fa';
import styles from '@/styles/SemanticScore.module.scss';
import AISparkleLoader from '@/components/AISparkleLoader';
import {
  setContent,
  setLoading,
  setError,
  setApiResponse,
  reset
} from '@/store/slices/semanticScoreSlice';
import { setIncomingContent } from '@/store/slices/rewriteSlice';
import type { RootState } from '@/store/store';

export default function SemanticScore() {
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    content,
    keywords,
    isLoading,
    error,
    lastUpdated,
    llmCitationScore,
    aiSearchOptimization,
    contentExtraction,
    llmSeoRecommendations,
  } = useSelector((state: RootState) => state.semanticScore);

  useEffect(() => {
    dispatch(reset());
  }, [dispatch]);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      dispatch(setError('Please provide HTML code to analyze'));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));
    
    try {
      const response = await fetch('/api/semantic-seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          keywords: [],
          url: 'https://example.com',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze HTML content');
      }

      const data = await response.json();
      dispatch(setApiResponse(data));
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'An error occurred'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRewriteForLLM = () => {
    // Store the content directly in the rewrite slice
    dispatch(setIncomingContent({ mode: 'semantic', content }));
    router.push('/rewrite-for-llm?mode=semantic');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return styles.excellent;
    if (score >= 60) return styles.good;
    if (score >= 40) return styles.fair;
    return styles.poor;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getCitationLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'very_high': return styles.veryHigh;
      case 'high': return styles.high;
      case 'medium': return styles.medium;
      case 'low': return styles.low;
      case 'very_low': return styles.veryLow;
      default: return styles.medium;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <FaCode className={styles.titleIcon} />
            <div>
              <h1 className={styles.title}>HTML Semantic SEO Analyzer</h1>
              <p className={styles.subtitle}>
                Analyze your HTML structure for semantic SEO optimization and get detailed insights
              </p>
            </div>
          </div>
          {lastUpdated && (
            <div className={styles.lastUpdated}>
              <FaClock />
              <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
            </div>
          )}
        </div>
      </header>

      {/* Code Editor Section */}
      <section className={styles.codeEditorSection}>
        <div className={styles.codeEditorCard}>
          <div className={styles.editorHeader}>
            <h2 className={styles.sectionTitle}>
              <FaCode className={styles.icon} />
              HTML Code Editor
            </h2>
            {content && (
              <button
                className={styles.clearButton}
                onClick={() => dispatch(setContent(''))}
                title="Clear HTML code"
              >
                <FaTrash />
                Clear
              </button>
            )}
          </div>
          
          <div className={styles.codeEditorContainer}>
            <textarea
              id="html-code-editor"
              name="html-code-editor"
              value={content}
              onChange={(e) => dispatch(setContent(e.target.value))}
              placeholder="Paste your HTML code here for semantic analysis..."
              className={styles.codeEditor}
              spellCheck={false}
              rows={12}
              aria-label="HTML code editor for semantic analysis"
            />
          </div>

          <button
            className={styles.analyzeButton}
            onClick={handleAnalyze}
            disabled={isLoading || !content.trim()}
          >
            <FaBrain />
            {isLoading ? 'Analyzing HTML Structure...' : 'Evaluate HTML Semantic SEO'}
          </button>

          {/* AI Sparkle Loader */}
          <AISparkleLoader isLoading={isLoading} />
        </div>
      </section>

      {/* Error Display */}
      {error && (
        <section className={styles.errorSection}>
          <div className={styles.errorCard}>
            <FaExclamationTriangle className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        </section>
      )}

      {/* Results Section */}
      {llmCitationScore && (
        <div className={styles.results}>
          {/* HTML Semantic Score */}
          <section className={styles.scoreSection}>
            <div className={styles.scoreCard}>
              <h2 className={styles.sectionTitle}>
                <FaBrain className={styles.icon} />
                HTML Semantic SEO Score
              </h2>
              <div className={styles.scoreDisplay}>
                <div className={`${styles.scoreCircle} ${getScoreColor(llmCitationScore.overallScore)}`}>
                  <div className={styles.scoreValue}>{llmCitationScore.overallScore}</div>
                  <div className={styles.scoreLabel}>{getScoreLabel(llmCitationScore.overallScore)}</div>
                </div>
                <div className={styles.scoreDetails}>
                  <div className={styles.citationLikelihood}>
                    <span className={styles.label}>Semantic Quality:</span>
                    <span className={`${styles.badge} ${getCitationLikelihoodColor(llmCitationScore.citationLikelihood)}`}>
                      {llmCitationScore.citationLikelihood.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={styles.confidenceLevel}>
                    <span className={styles.label}>Analysis Confidence:</span>
                    <span className={`${styles.badge} ${styles[llmCitationScore.confidenceLevel]}`}>
                      {llmCitationScore.confidenceLevel}
                    </span>
                  </div>
                  <p className={styles.reasoning}>{llmCitationScore.reasoning}</p>
                </div>
              </div>
              
              {/* Score Breakdown */}
              <div className={styles.scoreBreakdown}>
                <h3>HTML Structure Analysis</h3>
                <div className={styles.breakdownGrid}>
                  <div className={styles.breakdownItem}>
                    <span>Semantic Elements</span>
                    <div className={styles.contextTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>How well HTML uses proper semantic elements like article, section, nav, header, footer for AI understanding.</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progress} 
                        style={{ width: `${(llmCitationScore.breakdown.factualAuthority / 25) * 100}%` }}
                      ></div>
                    </div>
                    <span>{llmCitationScore.breakdown.factualAuthority}/25</span>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span>Heading Hierarchy</span>
                    <div className={styles.contextTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>Proper heading structure (h1-h6) and logical content flow for AI parsing and organization.</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progress} 
                        style={{ width: `${(llmCitationScore.breakdown.clarityOfClaims / 20) * 100}%` }}
                      ></div>
                    </div>
                    <span>{llmCitationScore.breakdown.clarityOfClaims}/20</span>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span>Content Structure</span>
                    <div className={styles.contextTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>How well content is organized with meaningful sections and logical flow for AI processing.</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progress} 
                        style={{ width: `${(llmCitationScore.breakdown.informationDensity / 20) * 100}%` }}
                      ></div>
                    </div>
                    <span>{llmCitationScore.breakdown.informationDensity}/20</span>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span>Accessibility</span>
                    <div className={styles.contextTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>ARIA labels, roles, alt attributes, and accessibility features that help AI systems understand content.</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progress} 
                        style={{ width: `${(llmCitationScore.breakdown.structuralAccessibility / 15) * 100}%` }}
                      ></div>
                    </div>
                    <span>{llmCitationScore.breakdown.structuralAccessibility}/15</span>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span>Schema Markup</span>
                    <div className={styles.contextTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>Structured data markup (schema.org) for better search engine and AI understanding.</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progress} 
                        style={{ width: `${(llmCitationScore.breakdown.sourceCredibility / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span>{llmCitationScore.breakdown.sourceCredibility}/10</span>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span>SEO Elements</span>
                    <div className={styles.contextTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>Meta tags, title structure, and SEO-friendly elements for better AI search optimization.</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progress} 
                        style={{ width: `${(llmCitationScore.breakdown.temporalRelevance / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span>{llmCitationScore.breakdown.temporalRelevance}/10</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* HTML Structure Analysis */}
          {aiSearchOptimization && (
            <section className={styles.optimizationSection}>
              <div className={styles.optimizationCard}>
                <h2 className={styles.sectionTitle}>
                  <FaSearch className={styles.icon} />
                  HTML Structure Analysis
                </h2>
                <div className={styles.optimizationGrid}>
                  <div className={styles.optimizationItem}>
                    <h3>Semantic Elements Found</h3>
                    <div className={styles.contextTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>HTML5 semantic elements detected that help AI systems understand content structure and meaning.</span>
                    </div>
                    <div className={styles.scoreDisplay}>
                      <div className={`${styles.miniScore} ${getScoreColor(aiSearchOptimization.knowledgeGraphCompatibility.score)}`}>
                        {aiSearchOptimization.knowledgeGraphCompatibility.score}
                      </div>
                    </div>
                    <div className={styles.entityList}>
                      <h4>Detected Elements:</h4>
                      <div className={styles.entityTags}>
                        {aiSearchOptimization.knowledgeGraphCompatibility.entityRecognition.map((entity, index) => (
                          <span key={index} className={styles.entityTag}>{entity}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.optimizationItem}>
                    <h3>Heading Structure</h3>
                    <div className={styles.contextTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>Analysis of heading hierarchy and content organization patterns for AI comprehension.</span>
                    </div>
                    <div className={styles.scoreDisplay}>
                      <div className={`${styles.miniScore} ${getScoreColor(aiSearchOptimization.semanticUnderstanding.score)}`}>
                        {aiSearchOptimization.semanticUnderstanding.score}
                      </div>
                    </div>
                    <div className={styles.patternsList}>
                      <h4>Heading Hierarchy:</h4>
                      <ul>
                        {aiSearchOptimization.semanticUnderstanding.languagePatterns.map((pattern, index) => (
                          <li key={index}>{pattern}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className={styles.optimizationItem}>
                    <h3>Content Organization</h3>
                    <div className={styles.contextTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>How well content sections are organized and structured for AI processing and understanding.</span>
                    </div>
                    <div className={styles.scoreDisplay}>
                      <div className={`${styles.miniScore} ${getScoreColor(aiSearchOptimization.queryMatching.score)}`}>
                        {aiSearchOptimization.queryMatching.score}
                      </div>
                    </div>
                    <div className={styles.queriesList}>
                      <h4>Content Sections:</h4>
                      <ul>
                        {aiSearchOptimization.queryMatching.coveredQueries.slice(0, 3).map((query, index) => (
                          <li key={index}>{query}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className={styles.optimizationItem}>
                    <h3>Accessibility Features</h3>
                    <div className={styles.contextTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>Accessibility elements and features that help AI systems better understand and process content.</span>
                    </div>
                    <div className={styles.scoreDisplay}>
                      <div className={`${styles.miniScore} ${getScoreColor(aiSearchOptimization.contextualRelevance.score)}`}>
                        {aiSearchOptimization.contextualRelevance.score}
                      </div>
                    </div>
                    <div className={styles.contextList}>
                      <h4>Accessibility Elements:</h4>
                      <ul>
                        {aiSearchOptimization.contextualRelevance.contextualElements.slice(0, 3).map((element, index) => (
                          <li key={index}>{element}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* HTML Improvement Suggestions */}
          {contentExtraction && (
            <section className={styles.extractionSection}>
              <div className={styles.extractionCard}>
                <h2 className={styles.sectionTitle}>
                  <FaLightbulb className={styles.icon} />
                  HTML Improvement Suggestions
                </h2>
                
                {/* Semantic Element Suggestions */}
                <div className={styles.extractionItem}>
                  <h3>Semantic Element Recommendations</h3>
                  <div className={styles.statementsList}>
                    {contentExtraction.quoteWorthyStatements.slice(0, 3).map((statement, index) => (
                      <div key={index} className={styles.statementCard}>
                        <div className={styles.statementHeader}>
                          <span className={`${styles.authorityBadge} ${styles[statement.authorityLevel]}`}>
                            {statement.authorityLevel}
                          </span>
                          <span className={styles.citationValue}>
                            Priority: {statement.citationValue}%
                          </span>
                        </div>
                        <p className={styles.statementText}>{statement.statement}</p>
                        <p className={styles.statementContext}>{statement.context}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Structure Improvements */}
                <div className={styles.extractionItem}>
                  <h3>Structure Improvements</h3>
                  <div className={styles.claimsList}>
                    {contentExtraction.factualClaims.slice(0, 3).map((claim, index) => (
                      <div key={index} className={styles.claimCard}>
                        <p className={styles.claimText}>{claim.claim}</p>
                        <div className={styles.claimMetrics}>
                          <span>Impact: {claim.strength}%</span>
                          <span>Implementation: {claim.supportability}%</span>
                          <span>SEO Value: {claim.citationPotential}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* HTML SEO Recommendations */}
          {llmSeoRecommendations && (
            <section className={styles.recommendationsSection}>
              <div className={styles.recommendationsCard}>
                <h2 className={styles.sectionTitle}>
                  <FaRocket className={styles.icon} />
                  HTML Semantic SEO Recommendations
                </h2>
                
                {/* Critical Recommendations */}
                {llmSeoRecommendations.critical.length > 0 && (
                  <div className={styles.recommendationGroup}>
                    <h3 className={styles.criticalTitle}>Critical Priority</h3>
                    <div className={styles.recommendationsList}>
                      {llmSeoRecommendations.critical.map((rec, index) => (
                        <div key={index} className={`${styles.recommendationCard} ${styles.critical}`}>
                          <div className={styles.recommendationHeader}>
                            <span className={styles.impactBadge}>High Impact</span>
                            <span className={styles.effortBadge}>{rec.effort} Effort</span>
                          </div>
                          <p className={styles.recommendationText}>{rec.recommendation}</p>
                          <p className={styles.llmBenefit}>{rec.llmBenefit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* High Priority Recommendations */}
                {llmSeoRecommendations.highPriority.length > 0 && (
                  <div className={styles.recommendationGroup}>
                    <h3>High Priority</h3>
                    <div className={styles.recommendationsList}>
                      {llmSeoRecommendations.highPriority.slice(0, 3).map((rec, index) => (
                        <div key={index} className={`${styles.recommendationCard} ${styles.highPriority}`}>
                          <div className={styles.recommendationHeader}>
                            <span className={styles.impactBadge}>{rec.impact} Impact</span>
                            <span className={styles.effortBadge}>{rec.effort} Effort</span>
                          </div>
                          <p className={styles.recommendationText}>{rec.recommendation}</p>
                          <p className={styles.llmBenefit}>{rec.llmBenefit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Rewrite Button */}
          <section className={styles.rewriteSection}>
            <div className={styles.rewriteCard}>
              <div className={styles.rewriteContent}>
                <h2>Ready to optimize your HTML for better semantic SEO?</h2>
                <p>Use our advanced rewriting tool to enhance your HTML structure based on the semantic analysis results.</p>
                <button
                  className={styles.rewriteButton}
                  onClick={handleRewriteForLLM}
                >
                  <FaArrowRight />
                  Rewrite HTML for Semantic SEO
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
} 
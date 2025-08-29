'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
  FaSearch, 
  FaPlus, 
  FaMinus, 
  FaFileAlt, 
  FaArrowRight, 
  FaChartLine, 
  FaLightbulb, 
  FaRocket, 
  FaCopy,
  FaDownload,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaBrain,
  FaBullseye,
  FaChartBar,
  FaShieldAlt,
  FaCog,
  FaPlay
} from 'react-icons/fa';
import styles from '@/styles/QueryOptimizer.module.scss';
import {
  addQuery,
  removeQuery,
  updateQuery,
  setHeading,
  setArticleContent,
  resetState
} from '@/store/slices/queryOptimizerSlice';
import type { RootState } from '@/store/store';

interface QueryOptimizationResult {
  llmOptimizedQueries: Array<{
    query: string;
    llmCitationPotential: number;
    authoritySignals: string[];
    semanticUnderstanding: number;
    knowledgeGraphCompatibility: number;
    citationTriggers: string[];
    implementationDifficulty: 'low' | 'medium' | 'high';
    optimizationType: 'semantic' | 'authority' | 'citation' | 'knowledge_graph';
    rationale: string;
    llmBenefit: string;
    competitiveAdvantage: string;
  }>;
  llmSeoMetrics: {
    citationLikelihood: number;
    authorityScore: number;
    semanticUnderstanding: number;
    knowledgeGraphCompatibility: number;
    competitivePosition: 'leading' | 'competitive' | 'lagging';
  };
  implementationPlan: {
    steps: Array<{
      step: string;
      llmBenefit: string;
      implementation: string;
      expectedOutcome: string;
    }>;
    timeline: string;
    priority: 'low' | 'medium' | 'high';
    successMetrics: {
      primaryKPI: string;
      secondaryKPIs: string[];
      llmSpecificMetrics: {
        citationFrequency: string;
        authorityRecognition: string;
        knowledgeGraphInclusion: string;
      };
    };
  };
  riskAssessment: {
    risks: Array<{
      risk: string;
      probability: number;
      impact: 'high' | 'medium' | 'low';
      mitigation: string[];
      llmConsideration: string;
    }>;
    riskScore: number;
  };
}

export default function QueryOptimizer() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { llmQueries, heading, articleContent, isValid } = useSelector(
    (state: RootState) => state.queryOptimizer
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QueryOptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddQuery = () => {
    dispatch(addQuery());
  };

  const handleRemoveQuery = (index: number) => {
    dispatch(removeQuery(index));
  };

  const handleQueryChange = (index: number, value: string) => {
    dispatch(updateQuery({ index, value }));
  };

  const handleHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setHeading(e.target.value));
  };

  const handleArticleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setArticleContent(e.target.value));
  };

  const handleAnalyze = async () => {
    if (!isValid) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/query-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentQueries: llmQueries.filter(q => q.trim()),
          searchIntent: heading,
          userBehavior: {
            contentLength: articleContent.length,
            queryCount: llmQueries.filter(q => q.trim()).length,
            contentType: 'article'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze queries');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRewriteRedirect = () => {
    if (!analysisResult) return;

    // Prepare the data for the rewrite page
    const queries = llmQueries.filter(q => q.trim()).join('|');
    const content = encodeURIComponent(articleContent);
    const headingEncoded = encodeURIComponent(heading);

    // Redirect to rewrite page with auto-fill data
    router.push(`/rewrite-for-llm?mode=query&heading=${headingEncoded}&content=${content}&query=${encodeURIComponent(queries)}`);
  };

  const handleReset = () => {
    dispatch(resetState());
    setAnalysisResult(null);
    setError(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCompetitivePositionColor = (position: string) => {
    switch (position) {
      case 'leading': return '#10b981';
      case 'competitive': return '#f59e0b';
      case 'lagging': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRiskImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          <FaSearch className={styles.icon} />
          Query Optimizer for LLM SEO
        </h1>
        <p className={styles.subtitle}>
          Optimize your content and queries for better LLM visibility, citations, and AI search performance.
        </p>
      </header>

      {/* Query Input Section */}
      <section className={`${styles.querySection} ${analysisResult ? styles.hasResults : ''}`}>
        <h2 className={styles.sectionTitle}>
          <FaSearch className={styles.icon} />
          LLM Queries
          {analysisResult && (
            <span className={styles.editableIndicator}>
              (Editable - modify and re-analyze)
            </span>
          )}
        </h2>
        <div className={styles.queryList}>
          {llmQueries.map((query, index) => (
            <div key={index} className={styles.queryInput}>
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(index, e.target.value)}
                placeholder="Enter an LLM-style query..."
              />
              {llmQueries.length > 1 && (
                <button
                  className={styles.removeButton}
                  onClick={() => handleRemoveQuery(index)}
                  title="Remove query"
                >
                  <FaMinus />
                </button>
              )}
              {index === llmQueries.length - 1 && llmQueries.length < 6 && (
                <button
                  className={styles.addButton}
                  onClick={handleAddQuery}
                  title="Add query"
                >
                  <FaPlus />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Content Input Section */}
      <section className={`${styles.contentSection} ${analysisResult ? styles.hasResults : ''}`}>
        <h2 className={styles.sectionTitle}>
          <FaFileAlt className={styles.icon} />
          Content to Optimize
          {analysisResult && (
            <span className={styles.editableIndicator}>
              (Editable - modify and re-analyze)
            </span>
          )}
        </h2>
        <div className={styles.headingInput}>
          <input
            type="text"
            value={heading}
            onChange={handleHeadingChange}
            placeholder="Enter your article heading..."
          />
        </div>
        <div className={styles.articleEditor}>
          <textarea
            value={articleContent}
            onChange={handleArticleChange}
            placeholder="Enter your article content..."
          />
        </div>
      </section>

      {/* Analyze Button */}
      <div className={styles.buttonGroup}>
        <button
          className={styles.analyzeButton}
          onClick={handleAnalyze}
          disabled={!isValid || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <FaCog className={`${styles.icon} ${styles.spinning}`} />
              Analyzing...
            </>
          ) : (
            <>
              <FaBrain className={styles.icon} />
              {analysisResult ? 'Re-analyze for LLM Optimization' : 'Analyze for LLM Optimization'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle className={styles.icon} />
          {error}
        </div>
      )}

      {analysisResult && (
        /* Dashboard UI */
        <div className={styles.dashboard}>
          {/* Dashboard Explanation */}
          <section className={styles.dashboardExplanation}>
            <h2 className={styles.sectionTitle}>
              <FaInfoCircle className={styles.icon} />
              Understanding Your LLM SEO Analysis
            </h2>
            <div className={styles.explanationContent}>
              <div className={styles.explanationCard}>
                <h3>What is LLM SEO?</h3>
                <p>
                  LLM SEO (Large Language Model Search Engine Optimization) focuses on optimizing content for AI-powered search engines and chatbots like ChatGPT, Gemini, and Claude. Unlike traditional SEO, LLM SEO aims to improve citation rates, authority recognition, and semantic understanding in AI systems.
                </p>
              </div>
              
              <div className={styles.explanationCard}>
                <h3>Key Metrics Explained</h3>
                <ul>
                  <li><strong>Citation Likelihood:</strong> How often AI systems will reference your content as a source</li>
                  <li><strong>Authority Score:</strong> How AI systems perceive your content's expertise and credibility</li>
                  <li><strong>Semantic Understanding:</strong> How well AI systems comprehend your content's meaning and context</li>
                  <li><strong>Knowledge Graph:</strong> How well your content aligns with AI knowledge structures</li>
                  <li><strong>Competitive Position:</strong> Your ranking relative to competitors in AI search results</li>
                  <li><strong>Risk Score:</strong> Potential challenges in implementing the optimization strategy</li>
                </ul>
              </div>

              <div className={styles.explanationCard}>
                <h3>Optimization Types</h3>
                <ul>
                  <li><strong>Semantic:</strong> Improves AI understanding of content meaning and relationships</li>
                  <li><strong>Authority:</strong> Enhances credibility signals and expert recognition</li>
                  <li><strong>Citation:</strong> Increases likelihood of being referenced as a source</li>
                  <li><strong>Knowledge Graph:</strong> Better alignment with AI knowledge structures</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Metrics Overview */}
          <section className={styles.metricsOverview}>
            <h2 className={styles.sectionTitle}>
              <FaChartLine className={styles.icon} />
              LLM SEO Metrics
            </h2>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <FaBullseye className={styles.metricIcon} />
                  <span>Citation Likelihood</span>
                  <div className={styles.tooltip}>
                    <FaInfoCircle className={styles.tooltipIcon} />
                    <span className={styles.tooltipText}>
                      Probability that LLMs like ChatGPT will cite your content as a source when responding to related queries. Higher scores indicate better chances of being referenced in AI-generated responses.
                    </span>
                  </div>
                </div>
                <div className={styles.metricValue}>
                  {analysisResult.llmSeoMetrics.citationLikelihood}%
                </div>
                <div className={styles.metricDescription}>
                  Probability of LLM citations
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <FaShieldAlt className={styles.metricIcon} />
                  <span>Authority Score</span>
                  <div className={styles.tooltip}>
                    <FaInfoCircle className={styles.tooltipIcon} />
                    <span className={styles.tooltipText}>
                      How AI systems perceive your content's expertise and credibility. Higher scores indicate content is recognized as authoritative and trustworthy by LLMs.
                    </span>
                  </div>
                </div>
                <div className={styles.metricValue}>
                  {analysisResult.llmSeoMetrics.authorityScore}%
                </div>
                <div className={styles.metricDescription}>
                  Perceived expertise level
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <FaBrain className={styles.metricIcon} />
                  <span>Semantic Understanding</span>
                  <div className={styles.tooltip}>
                    <FaInfoCircle className={styles.tooltipIcon} />
                    <span className={styles.tooltipText}>
                      How well AI systems comprehend and categorize your content. Higher scores mean LLMs can better understand context, meaning, and relationships in your content.
                    </span>
                  </div>
                </div>
                <div className={styles.metricValue}>
                  {analysisResult.llmSeoMetrics.semanticUnderstanding}%
                </div>
                <div className={styles.metricDescription}>
                  AI comprehension level
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <FaChartBar className={styles.metricIcon} />
                  <span>Knowledge Graph</span>
                  <div className={styles.tooltip}>
                    <FaInfoCircle className={styles.tooltipIcon} />
                    <span className={styles.tooltipText}>
                      How well your content aligns with AI knowledge structures and entity recognition. Higher scores improve discoverability in AI-powered search and knowledge systems.
                    </span>
                  </div>
                </div>
                <div className={styles.metricValue}>
                  {analysisResult.llmSeoMetrics.knowledgeGraphCompatibility}%
                </div>
                <div className={styles.metricDescription}>
                  Entity recognition score
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <FaRocket className={styles.metricIcon} />
                  <span>Competitive Position</span>
                  <div className={styles.tooltip}>
                    <FaInfoCircle className={styles.tooltipIcon} />
                    <span className={styles.tooltipText}>
                      Your content's positioning relative to competitors in AI search results. "Leading" means you're ahead, "Competitive" means you're on par, "Lagging" means you need improvement.
                    </span>
                  </div>
                </div>
                <div 
                  className={styles.metricValue}
                  style={{ color: getCompetitivePositionColor(analysisResult.llmSeoMetrics.competitivePosition) }}
                >
                  {analysisResult.llmSeoMetrics.competitivePosition.charAt(0).toUpperCase() + 
                   analysisResult.llmSeoMetrics.competitivePosition.slice(1)}
                </div>
                <div className={styles.metricDescription}>
                  Market positioning
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <FaExclamationTriangle className={styles.metricIcon} />
                  <span>Risk Score</span>
                  <div className={styles.tooltip}>
                    <FaInfoCircle className={styles.tooltipIcon} />
                    <span className={styles.tooltipText}>
                      Potential challenges and risks in implementing the optimization strategy. Lower scores indicate safer implementation with fewer potential issues.
                    </span>
                  </div>
                </div>
                <div className={styles.metricValue}>
                  {analysisResult.riskAssessment.riskScore}%
                </div>
                <div className={styles.metricDescription}>
                  Implementation risk level
                </div>
              </div>
            </div>
          </section>

          {/* Optimized Queries */}
          <section className={styles.optimizedQueries}>
            <h2 className={styles.sectionTitle}>
              <FaLightbulb className={styles.icon} />
              Optimized LLM Queries
            </h2>
            <div className={styles.queriesGrid}>
              {analysisResult.llmOptimizedQueries.map((query, index) => (
                <div key={index} className={styles.queryCard}>
                  <div className={styles.queryHeader}>
                    <h3>{query.query}</h3>
                    <div className={styles.queryActions}>
                      <button
                        onClick={() => copyToClipboard(query.query)}
                        title="Copy query"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.queryMetrics}>
                    <div className={styles.metric}>
                      <span>Citation Potential:</span>
                      <span className={styles.metricValue}>{query.llmCitationPotential}%</span>
                    </div>
                    <div className={styles.metric}>
                      <span>Semantic Understanding:</span>
                      <span className={styles.metricValue}>{query.semanticUnderstanding}%</span>
                    </div>
                    <div className={styles.metric}>
                      <span>Knowledge Graph:</span>
                      <span className={styles.metricValue}>{query.knowledgeGraphCompatibility}%</span>
                    </div>
                  </div>

                  <div className={styles.queryTags}>
                    <span 
                      className={styles.difficultyTag}
                      style={{ backgroundColor: getDifficultyColor(query.implementationDifficulty) }}
                    >
                      {query.implementationDifficulty} difficulty
                    </span>
                    <span className={styles.typeTag}>
                      {query.optimizationType}
                    </span>
                  </div>

                  <div className={styles.queryDetails}>
                    <div className={styles.detailSection}>
                      <h4>
                        Authority Signals
                        <div className={styles.sectionTooltip}>
                          <FaInfoCircle className={styles.tooltipIcon} />
                          <span className={styles.tooltipText}>
                            Elements in the query that signal to AI systems that authoritative, expert content is needed. These help LLMs recognize your content as credible and trustworthy.
                          </span>
                        </div>
                      </h4>
                      <div className={styles.tagList}>
                        {query.authoritySignals.map((signal, idx) => (
                          <span key={idx} className={styles.tag}>{signal}</span>
                        ))}
                      </div>
                    </div>

                    <div className={styles.detailSection}>
                      <h4>
                        Citation Triggers
                        <div className={styles.sectionTooltip}>
                          <FaInfoCircle className={styles.tooltipIcon} />
                          <span className={styles.tooltipText}>
                            Query patterns that prompt LLMs to cite sources in their responses. These triggers increase the likelihood of your content being referenced as a source.
                          </span>
                        </div>
                      </h4>
                      <div className={styles.tagList}>
                        {query.citationTriggers.map((trigger, idx) => (
                          <span key={idx} className={styles.tag}>{trigger}</span>
                        ))}
                      </div>
                    </div>

                    <div className={styles.detailSection}>
                      <h4>
                        Rationale
                        <div className={styles.sectionTooltip}>
                          <FaInfoCircle className={styles.tooltipIcon} />
                          <span className={styles.tooltipText}>
                            The reasoning behind this query optimization. Explains why this approach will improve LLM performance and content discoverability.
                          </span>
                        </div>
                      </h4>
                      <p>{query.rationale}</p>
                    </div>

                    <div className={styles.detailSection}>
                      <h4>
                        LLM Benefit
                        <div className={styles.sectionTooltip}>
                          <FaInfoCircle className={styles.tooltipIcon} />
                          <span className={styles.tooltipText}>
                            Specific advantages this query provides when AI systems process and evaluate content. Shows how it improves citation, authority recognition, and semantic understanding.
                          </span>
                        </div>
                      </h4>
                      <p>{query.llmBenefit}</p>
                    </div>

                    <div className={styles.detailSection}>
                      <h4>
                        Competitive Advantage
                        <div className={styles.sectionTooltip}>
                          <FaInfoCircle className={styles.tooltipIcon} />
                          <span className={styles.tooltipText}>
                            How this query optimization helps your content outperform competitors in AI search results and LLM responses.
                          </span>
                        </div>
                      </h4>
                      <p>{query.competitiveAdvantage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Implementation Plan */}
          <section className={styles.implementationPlan}>
            <h2 className={styles.sectionTitle}>
              <FaCog className={styles.icon} />
              Implementation Plan
            </h2>
            <div className={styles.planDetails}>
              <div className={styles.planHeader}>
                <div className={styles.planInfo}>
                  <span className={styles.timeline}>Timeline: {analysisResult.implementationPlan.timeline}</span>
                  <span 
                    className={styles.priority}
                    style={{ backgroundColor: getDifficultyColor(analysisResult.implementationPlan.priority) }}
                  >
                    Priority: {analysisResult.implementationPlan.priority}
                  </span>
                </div>
              </div>

              <div className={styles.stepsList}>
                {analysisResult.implementationPlan.steps.map((step, index) => (
                  <div key={index} className={styles.stepCard}>
                    <div className={styles.stepNumber}>{index + 1}</div>
                    <div className={styles.stepContent}>
                      <h4>{step.step}</h4>
                      <p><strong>LLM Benefit:</strong> {step.llmBenefit}</p>
                      <p><strong>Implementation:</strong> {step.implementation}</p>
                      <p><strong>Expected Outcome:</strong> {step.expectedOutcome}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.successMetrics}>
                <h3>
                  Success Metrics
                  <div className={styles.contextTooltip}>
                    <FaInfoCircle className={styles.tooltipIcon} />
                    <span className={styles.tooltipText}>
                      Key performance indicators to measure the success of your LLM optimization strategy. These metrics help track improvements in AI visibility and citation rates.
                    </span>
                  </div>
                </h3>
                <div className={styles.metricsDetails}>
                  <div className={styles.metricItem}>
                    <strong>Primary KPI:</strong> {analysisResult.implementationPlan.successMetrics.primaryKPI}
                    <div className={styles.kpiTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>
                        The main metric to track for overall optimization success. This is your primary goal for measuring LLM performance improvements.
                      </span>
                    </div>
                  </div>
                  <div className={styles.metricItem}>
                    <strong>Secondary KPIs:</strong>
                    <div className={styles.kpiTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>
                        Supporting metrics that provide additional insights into optimization performance and help identify areas for improvement.
                      </span>
                    </div>
                    <ul>
                      {analysisResult.implementationPlan.successMetrics.secondaryKPIs.map((kpi, idx) => (
                        <li key={idx}>{kpi}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.metricItem}>
                    <strong>LLM-Specific Metrics:</strong>
                    <div className={styles.kpiTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>
                        Specialized metrics designed specifically for measuring AI and LLM performance, including citation frequency and authority recognition.
                      </span>
                    </div>
                    <ul>
                      <li>Citation Frequency: {analysisResult.implementationPlan.successMetrics.llmSpecificMetrics.citationFrequency}</li>
                      <li>Authority Recognition: {analysisResult.implementationPlan.successMetrics.llmSpecificMetrics.authorityRecognition}</li>
                      <li>Knowledge Graph Inclusion: {analysisResult.implementationPlan.successMetrics.llmSpecificMetrics.knowledgeGraphInclusion}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Risk Assessment */}
          <section className={styles.riskAssessment}>
            <h2 className={styles.sectionTitle}>
              <FaExclamationTriangle className={styles.icon} />
              Risk Assessment
              <div className={styles.contextTooltip}>
                <FaInfoCircle className={styles.tooltipIcon} />
                <span className={styles.tooltipText}>
                  Potential challenges and risks associated with implementing the optimization strategy. Includes probability, impact assessment, and mitigation strategies for each risk.
                </span>
              </div>
            </h2>
            <div className={styles.risksList}>
              {analysisResult.riskAssessment.risks.map((risk, index) => (
                <div key={index} className={styles.riskCard}>
                  <div className={styles.riskHeader}>
                    <h4>{risk.risk}</h4>
                    <div className={styles.riskMetrics}>
                      <span 
                        className={styles.probability}
                        style={{ backgroundColor: getRiskImpactColor(risk.impact) }}
                      >
                        {risk.probability}% probability
                      </span>
                      <span 
                        className={styles.impact}
                        style={{ backgroundColor: getRiskImpactColor(risk.impact) }}
                      >
                        {risk.impact} impact
                      </span>
                    </div>
                  </div>
                  <div className={styles.riskDetails}>
                    <p><strong>LLM Consideration:</strong> {risk.llmConsideration}</p>
                    <div className={styles.mitigation}>
                      <strong>Mitigation Strategies:</strong>
                      <ul>
                        {risk.mitigation.map((strategy, idx) => (
                          <li key={idx}>{strategy}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              className={styles.rewriteButton}
              onClick={handleRewriteRedirect}
            >
              <FaExternalLinkAlt className={styles.icon} />
              Rewrite for LLM-based SEO
            </button>
            <button
              className={styles.resetButton}
              onClick={handleReset}
            >
              <FaArrowRight className={styles.icon} />
              Start New Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
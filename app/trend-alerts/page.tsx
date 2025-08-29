'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
  FaChartLine, 
  FaPen, 
  FaInfoCircle, 
  FaArrowRight, 
  FaSearch, 
  FaTags, 
  FaLightbulb,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import styles from '@/styles/TrendAlerts.module.scss';
import {
  updateHeading,
  updateContent,
  setApiResponse,
  setLoading,
  setError,
  reset,
} from '@/store/slices/trendAlertsSlice';
import type { RootState } from '@/store/store';

interface Keyword {
  text: string;
  relevance: 'high' | 'medium' | 'low';
}

interface QuerySuggestion {
  text: string;
  relevance: 'high' | 'medium' | 'low';
  source: 'trending' | 'semantic' | 'related';
}

export default function TrendAlerts() {
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    heading,
    content,
    keywords,
    suggestions,
    isLoading,
    error,
    lastUpdated,
  } = useSelector((state: RootState) => state.trendAlerts);

  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    dispatch(reset());
  }, [dispatch]);

  useEffect(() => {
    setWordCount(content.split(/\s+/).filter(word => word.length > 0).length);
  }, [content]);

  const handleHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateHeading(e.target.value));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(updateContent(e.target.value));
  };

  const handleAnalyzeContent = async () => {
    if (!heading.trim() || !content.trim()) {
      dispatch(setError('Please provide both heading and content'));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));
    
    try {
      const response = await fetch('/api/trend-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heading: heading.trim(),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const data = await response.json();
      dispatch(setApiResponse(data));
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'An error occurred'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRewriteForQuery = (query: string) => {
    router.push(`/rewrite-for-llm?mode=query&heading=${encodeURIComponent(heading)}&content=${encodeURIComponent(content)}&query=${encodeURIComponent(query)}`);
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case 'high': return styles.highRelevance;
      case 'medium': return styles.mediumRelevance;
      case 'low': return styles.lowRelevance;
      default: return styles.mediumRelevance;
    }
  };

  const getRelevanceDescription = (relevance: string) => {
    switch (relevance) {
      case 'high': return 'Highly relevant for LLM citation and AI search optimization';
      case 'medium': return 'Moderately relevant with good potential for AI systems';
      case 'low': return 'Lower relevance but may still be useful for broader context';
      default: return 'Relevance level for AI systems and LLM citation';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'trending': return <FaChartLine />;
      case 'semantic': return <FaSearch />;
      case 'related': return <FaLightbulb />;
      default: return <FaSearch />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'trending': return 'Trending';
      case 'semantic': return 'Semantic';
      case 'related': return 'Related';
      default: return source;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <FaChartLine className={styles.titleIcon} />
            <div>
              <h1 className={styles.title}>Trend Alert Analysis</h1>
              <p className={styles.subtitle}>
                Extract keywords and discover trending queries to optimize your content for LLM visibility
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

      {/* Input Section */}
      <section className={styles.inputSection}>
        <div className={styles.inputCard}>
          <h2 className={styles.sectionTitle}>
            <FaPen className={styles.icon} />
            Content Input
          </h2>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <FaPen className={styles.icon} />
              Article Heading
            </label>
            <input
              type="text"
              value={heading}
              onChange={handleHeadingChange}
              placeholder="Enter your article heading..."
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <FaPen className={styles.icon} />
              Article Content
              <span className={styles.wordCount}>{wordCount} words</span>
            </label>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Enter your article content..."
              className={styles.textarea}
              rows={8}
            />
          </div>

          <button
            className={styles.analyzeButton}
            onClick={handleAnalyzeContent}
            disabled={isLoading || !heading.trim() || !content.trim()}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Analyzing Content...
              </>
            ) : (
              <>
                <FaChartLine />
                Analyze Content
              </>
            )}
          </button>
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

      {/* Keywords Section */}
      {keywords.length > 0 && (
        <section className={styles.keywordsSection}>
          <div className={styles.keywordsCard}>
            <h2 className={styles.sectionTitle}>
              <FaTags className={styles.icon} />
              Extracted Keywords
              <span className={styles.count}>({keywords.length})</span>
              <div className={styles.contextTooltip}>
                <FaInfoCircle className={styles.tooltipIcon} />
                <span className={styles.tooltipText}>Keywords ranked by relevance to your content and their potential for LLM citation and AI search optimization.</span>
              </div>
            </h2>
            <div className={styles.keywordsGrid}>
              {keywords.map((keyword: Keyword, index: number) => (
                <div key={index} className={styles.keywordChip}>
                  <span className={styles.keywordText}>{keyword.text}</span>
                  <div className={styles.relevanceContainer}>
                    <span className={`${styles.relevanceBadge} ${getRelevanceColor(keyword.relevance)}`}>
                      {keyword.relevance}
                    </span>
                    <div className={styles.contextTooltip}>
                      <FaInfoCircle className={styles.tooltipIcon} />
                      <span className={styles.tooltipText}>{getRelevanceDescription(keyword.relevance)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Query Suggestions Section */}
      {suggestions.length > 0 && (
        <section className={styles.suggestionsSection}>
          <div className={styles.suggestionsCard}>
            <h2 className={styles.sectionTitle}>
              <FaSearch className={styles.icon} />
              Query Suggestions
              <span className={styles.count}>({suggestions.length})</span>
              <div className={styles.contextTooltip}>
                <FaInfoCircle className={styles.tooltipIcon} />
                <span className={styles.tooltipText}>Query suggestions based on trending patterns, semantic analysis, and related content that users might ask LLMs.</span>
              </div>
            </h2>
            <div className={styles.suggestionsGrid}>
              {suggestions.map((suggestion: QuerySuggestion, index: number) => (
                <div key={index} className={styles.suggestionCard}>
                  <div className={styles.suggestionHeader}>
                    <div className={styles.suggestionMeta}>
                      <div className={styles.relevanceContainer}>
                        <span className={`${styles.relevanceBadge} ${getRelevanceColor(suggestion.relevance)}`}>
                          {suggestion.relevance}
                        </span>
                        <div className={styles.contextTooltip}>
                          <FaInfoCircle className={styles.tooltipIcon} />
                          <span className={styles.tooltipText}>{getRelevanceDescription(suggestion.relevance)}</span>
                        </div>
                      </div>
                      <div className={styles.sourceContainer}>
                        <span className={styles.sourceBadge}>
                          {getSourceIcon(suggestion.source)}
                          {getSourceLabel(suggestion.source)}
                        </span>
                        <div className={styles.contextTooltip}>
                          <FaInfoCircle className={styles.tooltipIcon} />
                          <span className={styles.tooltipText}>
                            {suggestion.source === 'trending' && 'Based on current trending topics and popular search patterns'}
                            {suggestion.source === 'semantic' && 'Derived from semantic analysis of your content and related concepts'}
                            {suggestion.source === 'related' && 'Generated from related content and topic associations'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.queryText}>
                    {suggestion.text}
                  </div>
                  
                  <button
                    className={styles.rewriteButton}
                    onClick={() => handleRewriteForQuery(suggestion.text)}
                  >
                    <FaArrowRight />
                    Rewrite for this query
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className={styles.infoSection}>
        <div className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <FaInfoCircle className={styles.infoIcon} />
            <h3>How it works</h3>
          </div>
          <div className={styles.infoContent}>
            <p>
                             Our AI analyzes your content to extract the most important keywords and generate 
               query suggestions that users might ask. Each suggestion includes a &quot;Rewrite&quot; button 
               that takes you to our LLM optimization tool to create content specifically for that query.
            </p>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <FaTags />
                <span>Keywords are ranked by relevance to your content</span>
              </div>
              <div className={styles.infoItem}>
                <FaSearch />
                <span>Query suggestions are based on trending and semantic analysis</span>
              </div>
              <div className={styles.infoItem}>
                <FaArrowRight />
                <span>Use the rewrite feature to optimize for specific queries</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 
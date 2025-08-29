'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaCode, FaSearch, FaCopy, FaDownload, FaArrowRight, FaMinus, FaPlus, FaUndo, FaTrash, FaRobot, FaPen, FaPenFancy, FaChartBar, FaLightbulb, FaBullseye, FaBrain, FaNetworkWired, FaRocket, FaEye, FaCheckCircle, FaArrowUp, FaInfoCircle } from 'react-icons/fa';
import styles from '@/styles/RewriteForLLM.module.scss';
import {
  setMode,
  setModeWithContent,
  updateGeneral,
  updateSemantic,
  updateQuery,
  addQuery,
  removeQuery,
  updateQueryText,
  startRewriting,
  setResult,
  reset,
  type RewriteMode
} from '@/store/slices/rewriteSlice';
import type { RootState } from '@/store/store';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import html from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { html as beautifyHtml } from 'js-beautify';

SyntaxHighlighter.registerLanguage('html', html);

const MAX_QUERY_LENGTH = 100;

export default function RewriteForLLM() {
  const dispatch = useDispatch();
  const resultsRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [queryInput, setQueryInput] = useState('');
  const [lineNumbers, setLineNumbers] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const {
    mode,
    general,
    semantic,
    query,
    isRewriting,
    result
  } = useSelector((state: RootState) => state.rewrite);
  




  // Handle incoming query parameters and Redux state
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode') as RewriteMode;
    const heading = searchParams.get('heading');
    const query = searchParams.get('query');

    if (mode) {
      if (mode === 'general') {
        // For general mode, still use URL content if available
        const content = searchParams.get('content');
        if (content) {
          dispatch(setModeWithContent({ 
            mode, 
            content: decodeURIComponent(content),
            heading: heading || ''
          }));
        } else {
          dispatch(setMode(mode));
        }
      } else if (mode === 'semantic') {
        // For semantic mode, content should already be set by setIncomingContent
        dispatch(setMode(mode));
      } else if (mode === 'query') {
        const content = searchParams.get('content');
        if (content) {
          dispatch(setModeWithContent({ 
            mode, 
            content: decodeURIComponent(content),
            heading: heading || ''
          }));
          if (query) {
            // Handle multiple queries separated by |
            const queries = decodeURIComponent(query).split('|').filter(q => q.trim());
            queries.forEach((queryText, index) => {
              if (index === 0) {
                // First query replaces the initial empty query
                dispatch(updateQueryText({ index: 0, value: queryText }));
              } else {
                // Additional queries need to be added
                dispatch(addQuery());
                dispatch(updateQueryText({ index: index + 1, value: queryText }));
              }
            });
          }
        } else {
          dispatch(setMode(mode));
        }
      }
    } else {
      dispatch(reset());
    }
  }, [dispatch]);

  const handleModeChange = (newMode: RewriteMode) => {
    if (newMode === mode) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      // Don't reset content when changing modes manually
      dispatch(setMode(newMode));
      setIsTransitioning(false);
    }, 300); // Match the transition duration in CSS
  };

  const handleGeneralChange = (field: 'heading' | 'content', value: string) => {
    dispatch(updateGeneral({ [field]: value }));
  };

  const handleSemanticChange = (value: string) => {
    dispatch(updateSemantic({ html: value }));
  };

  const handleQueryChange = (field: 'heading' | 'content', value: string) => {
    dispatch(updateQuery({ [field]: value }));
  };

  const handleAddQuery = () => {
    if (queryInput.trim() && query.queries.length < 6) {
      dispatch(addQuery());
      dispatch(updateQueryText({ index: query.queries.length, value: queryInput.trim() }));
      setQueryInput('');
    }
  };

  const handleRemoveQuery = (index: number) => {
    dispatch(removeQuery(index));
  };

  const handleQueryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_QUERY_LENGTH) {
      setQueryInput(value);
    }
  };

  const handleQueryInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && queryInput.trim()) {
      e.preventDefault();
      handleAddQuery();
    }
  };

  const handleRewrite = async () => {
    // Validate content before making API call
    let hasContent = false;
    switch (mode) {
      case 'general':
        hasContent = !!(general.heading.trim() || general.content.trim());
        break;
      case 'semantic':
        hasContent = !!semantic.html.trim();
        break;
      case 'query':
        hasContent = !!(query.heading.trim() || query.content.trim() || query.queries.some(q => q.trim()));
        break;
    }
    
    if (!hasContent) {
      alert('Please provide content before rewriting.');
      return;
    }
    
    dispatch(startRewriting());
    
    try {
      let requestBody: any = { mode };
      
      switch (mode) {
        case 'general':
          requestBody = {
            mode,
            heading: general.heading,
            content: general.content
          };
          break;
        case 'semantic':
          requestBody = {
            mode,
            html: semantic.html
          };
          break;
        case 'query':
          requestBody = {
            mode,
            heading: query.heading,
            content: query.content,
            queries: query.queries.filter(q => q.trim())
          };
          break;
      }

      const response = await fetch('/api/rewrite-for-llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to rewrite content');
      }

      const result = await response.json();
      
      let original = '';
      let optimized = '';
      let insights = null;
      
      switch (mode) {
        case 'general':
          original = general.content;
          optimized = result.optimizedContent?.content || original;
          insights = result;
          break;
        case 'semantic':
          original = semantic.html;
          optimized = result.optimizedHtml || original;
          insights = result;
          break;
        case 'query':
          original = query.content;
          optimized = result.optimizedContent?.content || original;
          insights = result;
          break;
      }
      
      dispatch(setResult({ original, optimized, insights }));
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error rewriting content:', error);
      alert('Failed to rewrite content. Please try again.');
      // Fallback to original content on error
      const original = mode === 'semantic' ? semantic.html : 
                      mode === 'query' ? query.content : general.content;
      dispatch(setResult({ original, optimized: original }));
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    dispatch(reset());
    setQueryInput('');
  };



  // Update line numbers when content changes
  useEffect(() => {
    if (semantic.html) {
      const lines = semantic.html.split('\n');
      const lineNumbersText = lines.map((_: string, i: number) => i + 1).join('\n');
      setLineNumbers(lineNumbersText);
    } else {
      setLineNumbers('');
    }
  }, [semantic.html]);

  // Sync scroll between editor and line numbers
  const handleEditorScroll = () => {
    if (editorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  // Handle paste event with beautification
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      try {
        const beautifiedHtml = beautifyHtml(pastedText, {
          indent_size: 2,
          wrap_line_length: 80,
          preserve_newlines: true,
          max_preserve_newlines: 2,
          indent_inner_html: true,
          unformatted: ['code', 'pre', 'em', 'strong', 'span'],
          content_unformatted: ['pre', 'code'],
          extra_liners: ['head', 'body', '/html'],
          indent_scripts: 'keep'
        });
        dispatch(updateSemantic({ html: beautifiedHtml }));
      } catch {
        // If beautification fails, use the original text
        dispatch(updateSemantic({ html: pastedText }));
      }
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('scroll', handleEditorScroll);
      return () => editor.removeEventListener('scroll', handleEditorScroll);
    }
  }, []);

  // Dashboard Components - Focused on Optimized Content and Why It's Better
  const renderOptimizedContentSection = (insights: any) => (
    <div className={styles.optimizedContentSection}>
      <div className={styles.contentHeader}>
        <h2 className={styles.contentTitle}>
          <FaRocket className={styles.icon} />
          Optimized Content
          <div className={styles.contextTooltip}>
            <FaInfoCircle className={styles.tooltipIcon} />
            <span className={styles.tooltipText}>Content optimized for maximum LLM citability, AI search visibility, and authority recognition.</span>
          </div>
        </h2>
        <div className={styles.optimizationScore}>
          <span className={styles.scoreValue}>{insights.optimizationScore}</span>
          <span className={styles.scoreLabel}>/100</span>
          <div className={styles.contextTooltip}>
            <FaInfoCircle className={styles.tooltipIcon} />
            <span className={styles.tooltipText}>Overall optimization score indicating how well content is structured for LLM citation and AI search performance.</span>
          </div>
        </div>
      </div>
      
      <div className={styles.contentDisplay}>
        {mode === 'semantic' ? (
          <SyntaxHighlighter
            language="html"
            style={vs2015}
            customStyle={{ 
              margin: 0, 
              borderRadius: '12px',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          >
            {result?.optimized || ''}
          </SyntaxHighlighter>
        ) : (
          <div className={styles.textContent}>
            {insights.optimizedContent?.heading && (
              <h3 className={styles.optimizedHeading}>{insights.optimizedContent.heading}</h3>
            )}
            <div className={styles.optimizedText}>{result?.optimized || ''}</div>
          </div>
        )}
      </div>
      
      <div className={styles.contentActions}>
        <button
          className={styles.copyButton}
          onClick={() => handleCopy(result?.optimized || '')}
          title="Copy optimized content"
        >
          <FaCopy />
          Copy Content
        </button>
        <button
          className={styles.downloadButton}
          onClick={() => handleDownload(result?.optimized || '', 'optimized-content.txt')}
          title="Download optimized content"
        >
          <FaDownload />
          Download
        </button>
      </div>
    </div>
  );

  const renderWhyBetterSection = (insights: any) => (
    <div className={styles.whyBetterSection}>
      <h2 className={styles.whyBetterTitle}>
        <FaLightbulb className={styles.icon} />
        Why This Optimized Content is Better
        <div className={styles.contextTooltip}>
          <FaInfoCircle className={styles.tooltipIcon} />
          <span className={styles.tooltipText}>Detailed explanation of how the optimized content improves LLM citation potential and AI search performance.</span>
        </div>
      </h2>
      
      <div className={styles.mainBenefit}>
        <h3>Primary Improvement</h3>
        <p>{insights.whyBetter?.mainBenefit}</p>
      </div>
      
      <div className={styles.improvementsGrid}>
        <div className={styles.improvementsSection}>
          <h3>Specific Improvements Made</h3>
          <div className={styles.contextTooltip}>
            <FaInfoCircle className={styles.tooltipIcon} />
            <span className={styles.tooltipText}>Concrete changes made to enhance content for LLM processing and citation.</span>
          </div>
          <div className={styles.improvementsList}>
            {insights.whyBetter?.specificImprovements?.map((improvement: string, index: number) => (
              <div key={index} className={styles.improvementItem}>
                <FaCheckCircle className={styles.checkIcon} />
                <span>{improvement}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.benefitsSection}>
          <h3>How This Helps AI Systems</h3>
          <div className={styles.contextTooltip}>
            <FaInfoCircle className={styles.tooltipIcon} />
            <span className={styles.tooltipText}>Specific benefits for AI systems including improved citation likelihood and authority recognition.</span>
          </div>
          <div className={styles.benefitsList}>
            {(insights.whyBetter?.llmBenefits || insights.whyBetter?.aiBenefits || insights.whyBetter?.queryBenefits)?.map((benefit: string, index: number) => (
              <div key={index} className={styles.benefitItem}>
                <FaBrain className={styles.brainIcon} />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = (insights: any) => (
    <div className={styles.dashboardContainer}>
      {renderOptimizedContentSection(insights)}
      {renderWhyBetterSection(insights)}
    </div>
  );

  const renderInputSection = () => {
    const inputContent = (() => {
      switch (mode) {
        case 'general':
          return (
            <>
              <div className={styles.inputGroup}>
                <label>
                  <FaPen className={styles.icon} />
                  Heading
                </label>
                <input
                  type="text"
                  value={general.heading}
                  onChange={(e) => handleGeneralChange('heading', e.target.value)}
                  placeholder="Enter your article heading..."
                />
              </div>
              <div className={styles.inputGroup}>
                <label>
                  <FaPen className={styles.icon} />
                  Content
                </label>
                <textarea
                  value={general.content}
                  onChange={(e) => handleGeneralChange('content', e.target.value)}
                  placeholder="Enter your article content..."
                />
              </div>
            </>
          );

        case 'semantic':
          return (
            <div className={styles.editorContainer}>
              <div className={styles.editor}>
                <label className={styles.editorLabel}>
                  <FaCode className={styles.icon} />
                  HTML Content
                </label>
                <div className={styles.editorContent}>
                  <div className={styles.lineNumbers} ref={lineNumbersRef}>
                    {lineNumbers}
                  </div>
                  <textarea
                    ref={editorRef}
                    className={styles.codeEditor}
                    value={semantic.html}
                    onChange={(e) => handleSemanticChange(e.target.value)}
                    onScroll={handleEditorScroll}
                    onPaste={handlePaste}
                    placeholder="Paste or write your HTML code here..."
                    spellCheck={false}
                  />
                  {semantic.html && (
                    <button
                      className={styles.clearButton}
                      onClick={() => dispatch(updateSemantic({ html: '' }))}
                      title="Clear content"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );

        case 'query':
          return (
            <>
              <div className={styles.inputGroup}>
                <label>
                  <FaPen className={styles.icon} />
                  Heading
                </label>
                <input
                  type="text"
                  value={query.heading}
                  onChange={(e) => handleQueryChange('heading', e.target.value)}
                  placeholder="Enter your article heading..."
                />
              </div>
              <div className={styles.inputGroup}>
                <label>
                  <FaPen className={styles.icon} />
                  Content
                </label>
                <textarea
                  value={query.content}
                  onChange={(e) => handleQueryChange('content', e.target.value)}
                  placeholder="Enter your article content..."
                />
              </div>
              <div className={styles.inputGroup}>
                <label>
                  <FaSearch className={styles.icon} />
                  LLM Queries
                </label>
                <div className={styles.queryList}>
                  {query.queries.map((queryText: string, index: number) => (
                    <div key={index} className={styles.queryChip}>
                      {queryText}
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveQuery(index)}
                        title="Remove query"
                      >
                        <FaMinus />
                      </button>
                    </div>
                  ))}
                  {query.queries.length < 6 && (
                    <div className={styles.queryInput}>
                      <input
                        type="text"
                        value={queryInput}
                        onChange={handleQueryInputChange}
                        onKeyDown={handleQueryInputKeyDown}
                        placeholder="Enter a query and press Enter..."
                        maxLength={MAX_QUERY_LENGTH}
                      />
                      <button
                        className={styles.addButton}
                        onClick={handleAddQuery}
                        title="Add query"
                        disabled={!queryInput.trim()}
                      >
                        <FaPlus />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
      }
    })();

    return (
      <div className={`${styles.inputSection} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
        <h2 className={styles.sectionTitle}>
          {mode === 'general' && <FaRobot className={styles.icon} />}
          {mode === 'semantic' && <FaCode className={styles.icon} />}
          {mode === 'query' && <FaSearch className={styles.icon} />}
          {mode === 'general' && 'Article Content'}
          {mode === 'semantic' && 'HTML Content'}
          {mode === 'query' && 'Query-Based Content'}
        </h2>
        {inputContent}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <FaPenFancy className={styles.icon} />
          Rewrite for LLM Optimization
        </h1>
        <p className={styles.subtitle}>
          Transform your content for better LLM visibility, citations, and relevance.
        </p>
      </header>

      <div className={styles.modeSelector}>
        <button
          className={`${styles.modeButton} ${mode === 'general' ? styles.active : ''}`}
          onClick={() => handleModeChange('general')}
        >
          <FaRobot className={styles.icon} />
          General LLM SEO
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'semantic' ? styles.active : ''}`}
          onClick={() => handleModeChange('semantic')}
        >
          <FaCode className={styles.icon} />
          Semantic SEO (HTML)
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'query' ? styles.active : ''}`}
          onClick={() => handleModeChange('query')}
        >
          <FaSearch className={styles.icon} />
          LLM Query-Based SEO
        </button>
      </div>

      {renderInputSection()}

      <div className={styles.buttonGroup}>
        <button
          className={styles.rewriteButton}
          onClick={handleRewrite}
          disabled={isRewriting}
        >
          {isRewriting ? 'Rewriting...' : 'Rewrite for LLM Optimization'}
          <FaArrowRight className={styles.icon} />
        </button>
        <button
          className={styles.resetButton}
          onClick={handleReset}
        >
          <FaUndo className={styles.icon} />
          Reset All
        </button>
      </div>

      {result && (
        <section
          ref={resultsRef}
          className={`${styles.resultsSection} ${styles.visible}`}
        >
          {/* Dashboard Section */}
          {result.insights && (
            <div className={styles.dashboardSection}>
              <div className={styles.dashboardHeader}>
                <h2 className={styles.dashboardTitle}>
                  <FaChartBar className={styles.icon} />
                  Optimization Dashboard
                </h2>
                <p className={styles.dashboardSubtitle}>
                  Comprehensive analysis and insights for your {mode} optimization
                </p>
              </div>
              
              {renderDashboard(result.insights)}
            </div>
          )}

          {/* Content Comparison Section */}
          <div className={styles.contentComparisonSection}>
            <h2 className={styles.comparisonTitle}>
              <FaEye className={styles.icon} />
              Content Comparison
            </h2>
            <div className={styles.resultsGrid}>
              <div className={styles.resultPanel}>
                <div className={styles.panelHeader}>
                  <h3>
                    {mode === 'general' && <FaRobot className={styles.icon} />}
                    {mode === 'semantic' && <FaCode className={styles.icon} />}
                    {mode === 'query' && <FaSearch className={styles.icon} />}
                    Original Content
                  </h3>
                  <div className={styles.actions}>
                    <button
                      onClick={() => handleCopy(result.original)}
                      title="Copy to clipboard"
                    >
                      <FaCopy />
                    </button>
                    <button
                      onClick={() => handleDownload(result.original, 'original.txt')}
                      title="Download"
                    >
                      <FaDownload />
                    </button>
                  </div>
                </div>
                <div className={styles.content}>
                  {mode === 'semantic' ? (
                    <SyntaxHighlighter
                      language="html"
                      style={vs2015}
                      customStyle={{ margin: 0, borderRadius: '8px' }}
                    >
                      {result.original}
                    </SyntaxHighlighter>
                  ) : (
                    result.original
                  )}
                </div>
              </div>

              <div className={styles.resultPanel}>
                <div className={styles.panelHeader}>
                  <h3>
                    {mode === 'general' && <FaRobot className={styles.icon} />}
                    {mode === 'semantic' && <FaCode className={styles.icon} />}
                    {mode === 'query' && <FaSearch className={styles.icon} />}
                    Optimized Content
                  </h3>
                  <div className={styles.actions}>
                                      <button
                    onClick={() => handleCopy(result.optimized)}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                  <button
                    onClick={() => handleDownload(result.optimized, 'optimized.txt')}
                    title="Download"
                  >
                    <FaDownload />
                  </button>
                  </div>
                </div>
                <div className={styles.content}>
                  {mode === 'semantic' ? (
                    <SyntaxHighlighter
                      language="html"
                      style={vs2015}
                      customStyle={{ margin: 0, borderRadius: '8px' }}
                    >
                      {result.optimized}
                    </SyntaxHighlighter>
                  ) : (
                    result.optimized
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
} 
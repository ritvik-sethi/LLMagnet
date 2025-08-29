import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// General LLM SEO Prompt - Focused on content optimization for broad LLM visibility
const getGeneralPrompt = (heading: string, content: string) => `
You are an expert content strategist specializing in LLM optimization with rigorous standards for content quality and AI processing. Rewrite the following content to maximize its citation potential and visibility in AI-powered search systems. Apply critical evaluation and optimization standards that would be used by top-tier content teams.

HEADING: ${heading}
CONTENT: ${content}

RIGOROUS OPTIMIZATION REQUIREMENTS:
1. Enhance factual density and authoritative tone with verifiable, specific claims
2. Structure for optimal LLM extraction and citation with clear semantic markers
3. Improve information hierarchy and semantic clarity for AI processing efficiency
4. Strengthen expertise signals and credibility indicators that AI systems recognize
5. Optimize for knowledge graph compatibility with accurate entity recognition
6. CRITICAL: Ensure all claims are supportable and avoid vague or unsupported assertions
7. CRITICAL: Structure content for maximum AI extraction efficiency and citation confidence

Return JSON:
{
  "optimizedContent": {
    "heading": "optimized heading",
    "content": "fully optimized content",
    "summary": "brief summary of key improvements"
  },
  "whyBetter": {
    "mainBenefit": "primary improvement explanation",
    "specificImprovements": [
      "specific improvement 1",
      "specific improvement 2",
      "specific improvement 3"
    ],
    "llmBenefits": [
      "how this helps LLMs cite the content",
      "how this improves AI search visibility",
      "how this enhances authority recognition"
    ]
  },
  "optimizationScore": 85
}`;

// Semantic SEO Prompt - Focused on HTML structure and semantic markup optimization
const getSemanticPrompt = (html: string) => `
You are a semantic SEO specialist with expertise in HTML optimization for AI systems and rigorous standards for semantic markup. Analyze and optimize the following HTML content for maximum semantic understanding and knowledge graph inclusion. Apply critical evaluation and optimization standards that would be used by top-tier web development teams.

HTML CONTENT: ${html}

RIGOROUS OPTIMIZATION REQUIREMENTS:
1. Enhance semantic markup and structured data with accurate, valid implementation
2. Optimize HTML structure for AI parsing with clear semantic relationships
3. Improve entity recognition and relationship mapping with precise entity identification
4. Strengthen content hierarchy and semantic signals for optimal AI processing
5. Ensure knowledge graph compatibility with accurate schema markup
6. CRITICAL: Ensure all semantic elements are used for their intended purpose, not just styling
7. CRITICAL: Validate structured data and ensure it accurately represents content relationships

Return JSON:
{
  "optimizedHtml": "fully optimized HTML with semantic markup",
  "whyBetter": {
    "mainBenefit": "primary semantic improvement explanation",
    "specificImprovements": [
      "specific semantic improvement 1",
      "specific semantic improvement 2",
      "specific semantic improvement 3"
    ],
    "aiBenefits": [
      "how this helps AI understand the content",
      "how this improves knowledge graph inclusion",
      "how this enhances entity recognition"
    ]
  },
  "optimizationScore": 90
}`;

// Query-Based SEO Prompt - Focused on optimizing content for specific LLM queries
const getQueryPrompt = (heading: string, content: string, queries: string[]) => `
You are a query optimization specialist for LLM systems with rigorous standards for query-specific content optimization. Rewrite the following content to specifically address and optimize for the given LLM queries. Apply critical evaluation and optimization standards that would be used by top-tier search optimization teams.

HEADING: ${heading}
CONTENT: ${content}
TARGET QUERIES: ${queries.join(', ')}

RIGOROUS OPTIMIZATION REQUIREMENTS:
1. Align content with specific query intent and context with high precision
2. Enhance query matching and relevance scoring with detailed relevance analysis
3. Optimize for targeted citation in query responses with specific citation triggers
4. Strengthen authority on query-specific topics with verifiable expertise signals
5. Improve information completeness for query coverage with comprehensive detail
6. CRITICAL: Ensure content directly addresses query intent without keyword stuffing
7. CRITICAL: Structure content for optimal AI processing and citation confidence

Return JSON:
{
  "optimizedContent": {
    "heading": "query-optimized heading",
    "content": "fully optimized content for target queries",
    "summary": "brief summary of query-specific improvements"
  },
  "whyBetter": {
    "mainBenefit": "primary query optimization benefit",
    "specificImprovements": [
      "specific query improvement 1",
      "specific query improvement 2",
      "specific query improvement 3"
    ],
    "queryBenefits": [
      "how this improves query matching",
      "how this enhances citation in query responses",
      "how this increases query relevance"
    ]
  },
  "optimizationScore": 88
}`;

export async function POST(request: Request) {
  try {
    const { mode, heading, content, html, queries } = await request.json();

    let prompt = '';

    switch (mode) {
      case 'general':
        prompt = getGeneralPrompt(heading || '', content || '');
        break;
      case 'semantic':
        prompt = getSemanticPrompt(html || '');
        break;
      case 'query':
        prompt = getQueryPrompt(heading || '', content || '', queries || []);
        break;
      default:
        throw new Error('Invalid mode specified');
    }

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      ...result,
      mode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in content rewriting:', error);
    return NextResponse.json(
      { error: 'Failed to rewrite content' },
      { status: 500 }
    );
  }
} 
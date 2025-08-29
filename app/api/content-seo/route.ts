import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import https from 'https';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  httpAgent: new https.Agent({
    rejectUnauthorized: false // Note: This is not recommended for production
  })
});

export async function POST(request: Request) {
  try {
    const { content, metaTitle } = await request.json();

    const prompt = `You are a senior LLM SEO specialist with deep expertise in how large language models (ChatGPT, Gemini, Claude, etc.) interpret, process, and cite content. Your role is to provide a comprehensive, evidence-based assessment of content's LLM citability potential and AI search optimization readiness. Apply rigorous, critical evaluation standards that would be used by top-tier AI research teams.

CONTENT TO EVALUATE:
Meta Title: ${metaTitle}
Content: ${content}

RIGOROUS LLM CITABILITY EVALUATION FRAMEWORK:

**1. LLM Citation Potential (0-25 points) - CRITICAL ASSESSMENT**
- Can LLMs quote this content directly when answering user queries with high confidence?
- Does it provide clear, definitive statements that are easily quotable AND factually accurate?
- Is the information structured in a way that's optimal for AI extraction AND verification?
- Does it contain factual claims that LLMs can confidently cite without qualification?
- Are statements specific enough to be useful but general enough to be broadly applicable?
- CRITICAL: Does content avoid vague language, unsupported claims, or ambiguous statements?
- Scoring: 0-5 (unusable for citation), 6-10 (requires significant qualification), 11-15 (citable with context), 16-20 (highly citable), 21-25 (exemplary citation quality)

**2. Factual Authority and Accuracy (0-20 points) - EXPERT VERIFICATION**
- Does the content demonstrate genuine subject matter expertise beyond surface-level knowledge?
- Are claims supported by credible sources, expert knowledge, or verifiable data?
- Is the information accurate, current, and verifiable through independent fact-checking?
- Does it provide substantial value beyond what's readily available from basic sources?
- CRITICAL: Are there any factual errors, outdated information, or unsupported assertions?
- Does the content demonstrate understanding of nuance, complexity, and counter-arguments?
- Scoring: 0-5 (factual errors or no authority), 6-10 (basic accuracy, limited authority), 11-15 (good accuracy, some authority), 16-20 (excellent accuracy, strong authority)

**3. Information Density and Value (0-20 points) - DEPTH ANALYSIS**
- Does the content provide substantial, valuable information that goes beyond surface coverage?
- Is there sufficient depth and comprehensiveness for LLM citation in expert-level responses?
- Does it answer questions that users commonly ask LLMs with actionable, detailed responses?
- Is the information unique or does it offer unique perspectives not found elsewhere?
- CRITICAL: Does content provide specific, actionable insights rather than general statements?
- Is the information density high enough to justify citation over summary?
- Scoring: 0-5 (minimal value, surface-level), 6-10 (moderate value, some depth), 11-15 (good value, substantial depth), 16-20 (exceptional value, comprehensive depth)

**4. Structural Accessibility (0-15 points) - AI PROCESSING OPTIMIZATION**
- Is content easy for LLMs to parse, extract, and understand without ambiguity?
- Are there clear semantic markers and organizational structure that facilitate AI processing?
- Is the information logically organized for AI processing with clear cause-and-effect relationships?
- Does the format facilitate easy citation and reference with clear attribution?
- CRITICAL: Is the structure optimized for AI extraction rather than just human readability?
- Are there clear topic sentences, supporting evidence, and logical flow?
- Scoring: 0-3 (unstructured, difficult to parse), 4-7 (basic structure, some parsing issues), 8-11 (good structure, clear parsing), 12-15 (excellent structure, optimal parsing)

**5. Heading and Title Optimization (0-10 points) - AI SELECTION CRITERIA**
- Is the heading likely to be selected by LLMs when answering queries with high relevance?
- Does it use question-based, curiosity-driven, or fact-rich formats that signal authority?
- Is it specific enough to be useful but broad enough to be relevant across multiple contexts?
- Does it signal authority and expertise to AI systems through precise terminology?
- CRITICAL: Does the heading accurately represent the content's depth and authority level?
- Is it optimized for AI understanding rather than just SEO or human appeal?
- Scoring: 0-2 (misleading or irrelevant), 3-5 (adequate but not optimal), 6-8 (good optimization), 9-10 (excellent AI optimization)

**6. Source Credibility and Trustworthiness (0-10 points) - AI TRUST ASSESSMENT**
- Does the content appear trustworthy and credible to AI systems based on established patterns?
- Are there sufficient authority indicators and expertise signals that AI systems recognize?
- Is the tone confident and authoritative without being biased or promotional?
- Does it demonstrate reliability and consistency with established facts and expert consensus?
- CRITICAL: Are there any red flags that would cause AI systems to question credibility?
- Does the content demonstrate awareness of limitations and uncertainties where appropriate?
- Scoring: 0-2 (untrustworthy or biased), 3-5 (adequate credibility), 6-8 (good credibility), 9-10 (excellent credibility)

RIGOROUS EVALUATION PRINCIPLES:
- Apply academic-level scrutiny: Would this content pass peer review for factual accuracy?
- Think like a skeptical LLM: What would cause ChatGPT, Gemini, or Claude to question or reject this content?
- Consider AI verification patterns: How do LLMs cross-reference and verify information?
- Focus on factual accuracy and quotability: Can content be directly cited with absolute confidence?
- Assess information density: Does content provide substantial value that justifies citation over summary?
- Evaluate structural accessibility: Is content optimized for AI processing and extraction?
- Consider citation frequency: How often would this content be relevant and trustworthy for LLM responses?
- Apply critical thinking: Are there gaps, inconsistencies, or weaknesses that undermine authority?

Return a JSON object with the following structure:
{
  "llmCitationScore": {
    "overallScore": number (0-100),
    "breakdown": {
      "llmCitationPotential": {
        "score": number (0-25),
        "reasoning": string,
        "citationStrengths": string[],
        "citationWeaknesses": string[]
      },
      "factualAuthority": {
        "score": number (0-20),
        "reasoning": string,
        "authoritySignals": string[],
        "authorityGaps": string[]
      },
      "informationDensity": {
        "score": number (0-20),
        "reasoning": string,
        "valueElements": string[],
        "valueGaps": string[]
      },
      "structuralAccessibility": {
        "score": number (0-15),
        "reasoning": string,
        "structuralStrengths": string[],
        "structuralIssues": string[]
      },
      "headingOptimization": {
        "score": number (0-10),
        "reasoning": string,
        "optimizationStrengths": string[],
        "optimizationOpportunities": string[]
      },
      "sourceCredibility": {
        "score": number (0-10),
        "reasoning": string,
        "credibilitySignals": string[],
        "credibilityIssues": string[]
      }
    },
    "citationLikelihood": "very_high" | "high" | "medium" | "low" | "very_low",
    "confidenceLevel": "high" | "medium" | "low"
  },
  "llmSeoAnalysis": {
    "citationOptimization": {
      "quoteWorthyStatements": [
        {
          "statement": string,
          "citationValue": number (0-100),
          "context": string,
          "authorityLevel": "high" | "medium" | "low"
        }
      ],
      "factualClaims": [
        {
          "claim": string,
          "strength": number (0-100),
          "supportability": number (0-100),
          "citationPotential": number (0-100)
        }
      ],
      "expertInsights": [
        {
          "insight": string,
          "credibility": number (0-100),
          "expertiseLevel": string,
          "citationValue": number (0-100)
        }
      ]
    },
    "aiSearchOptimization": {
      "knowledgeGraphCompatibility": {
        "score": number (0-100),
        "entityRecognition": string[],
        "relationshipMapping": object,
        "improvementAreas": string[]
      },
      "semanticUnderstanding": {
        "score": number (0-100),
        "languagePatterns": string[],
        "authoritySignals": string[],
        "terminologyUsage": object
      },
      "queryMatching": {
        "score": number (0-100),
        "coveredQueries": string[],
        "queryGaps": string[],
        "matchingStrength": object
      }
    },
    "contentStructure": {
      "informationArchitecture": {
        "score": number (0-100),
        "structure": string,
        "parsingEase": number (0-100),
        "improvements": string[]
      },
      "semanticMarkers": {
        "score": number (0-100),
        "markers": string[],
        "categorization": object,
        "enhancements": string[]
      },
      "contextualCues": {
        "score": number (0-100),
        "cues": string[],
        "significance": object,
        "missingElements": string[]
      }
    }
  },
  "llmOptimizationRecommendations": {
    "critical": [
      {
        "recommendation": string,
        "impact": "high" | "medium" | "low",
        "effort": "low" | "medium" | "high",
        "llmBenefit": string
      }
    ],
    "highPriority": [
      {
        "recommendation": string,
        "impact": "high" | "medium" | "low",
        "effort": "low" | "medium" | "high",
        "llmBenefit": string
      }
    ],
    "mediumPriority": [
      {
        "recommendation": string,
        "impact": "high" | "medium" | "low",
        "effort": "low" | "medium" | "high",
        "llmBenefit": string
      }
    ]
  },
  "citationEnhancement": {
    "structuralImprovements": string[],
    "contentAdditions": string[],
    "authorityStrengthening": string[],
    "factualEnhancements": string[],
    "formattingOptimizations": string[]
  },
  "llmSeoMetrics": {
    "citationLikelihood": number (0-100),
    "authorityScore": number (0-100),
    "informationValue": number (0-100),
    "structuralOptimization": number (0-100),
    "competitivePosition": "leading" | "competitive" | "lagging"
  },
  "contentTransformation": {
    "qaFormatPotential": boolean,
    "suggestedQuestions": string[],
    "structuralImprovements": string[],
    "citationOptimizations": string[]
  }
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      ...analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in content SEO analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
} 
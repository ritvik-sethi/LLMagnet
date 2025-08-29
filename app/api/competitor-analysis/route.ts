import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { yourContent, competitorContent, keywords, marketPosition } = await request.json();

    const prompt = `You are a senior LLM SEO specialist with deep expertise in how large language models (ChatGPT, Gemini, Claude, etc.) interpret, process, and cite content. Your task is to perform a competitive gap analysis specifically through the lens of LLM citability and AI search optimization. Apply rigorous, critical evaluation standards that would be used by top-tier competitive intelligence teams.

CONTENT TO ANALYZE:
Your Content: ${yourContent}
Competitor Content: ${competitorContent}
Target Keywords: ${keywords.join(', ')}
Market Position: ${marketPosition}

RIGOROUS LLM CITABILITY ANALYSIS FRAMEWORK:

**1. LLM Citation Potential (0-100) - CRITICAL COMPARISON**
Evaluate how likely LLMs are to cite each piece of content when answering user queries with strict scrutiny:
- Factual Accuracy: Does content provide verifiable, authoritative information that withstands fact-checking?
- Clarity of Claims: Are statements clear, definitive, and easily quotable without qualification?
- Source Credibility: Does content demonstrate genuine expertise and authority beyond surface-level knowledge?
- Information Density: Does content provide substantial, valuable information that justifies citation over summary?
- Structural Accessibility: Is content easy for LLMs to parse and extract with high confidence?
- CRITICAL: Are there any factual errors, unsupported claims, or credibility issues that would prevent citation?

**2. AI Search Optimization - COMPREHENSIVE ASSESSMENT**
- Knowledge Graph Compatibility: How well does content fit into AI knowledge structures with accurate entity recognition?
- Semantic Understanding: Does content use language patterns LLMs recognize as authoritative and trustworthy?
- Query Matching: How well does content answer common user questions with actionable, detailed responses?
- Contextual Relevance: Does content provide comprehensive context for topics that enhances AI understanding?
- Temporal Accuracy: Is content current and relevant to contemporary discussions with up-to-date information?
- CRITICAL: Does content demonstrate awareness of current trends, recent developments, and evolving knowledge?

**3. Content Extraction Analysis - DETAILED EXAMINATION**
- Quote-Worthy Statements: Identify specific phrases LLMs would likely cite with high confidence and why
- Factual Claims: Evaluate the strength and supportability of factual assertions against established knowledge
- Expert Opinions: Assess the credibility and quotability of expert insights with verification of expertise
- Data and Statistics: Evaluate the presentation and reliability of numerical information with source verification
- Comparative Analysis: How do claims compare to established facts and expert consensus in the field?
- CRITICAL: Are there any claims that would require qualification or disclaimer when cited by LLMs?

**4. Competitive LLM Advantages - STRATEGIC POSITIONING**
- Unique Insights: What perspectives or information does your content offer that competitors don't, and why is it valuable?
- Authority Signals: How does your content demonstrate expertise vs. competitors with specific evidence?
- Citation Frequency: Which content would LLMs prefer to cite and why, with detailed reasoning?
- Information Completeness: Which content provides more comprehensive coverage with actionable depth?
- Credibility Indicators: Which content appears more trustworthy to AI systems with specific trust signals?
- CRITICAL: What specific advantages or disadvantages exist in terms of AI system recognition and preference?

**5. LLM SEO Gaps and Opportunities - ACTIONABLE INSIGHTS**
- Missing Factual Claims: What authoritative statements could be added to improve citation potential?
- Citation Enhancement: How can content be structured for better LLM extraction with specific recommendations?
- Authority Building: What expertise signals could be strengthened to improve AI recognition?
- Information Gaps: What topics or details are missing that LLMs would value for comprehensive responses?
- Structural Improvements: How can content be organized for better AI processing with specific structural changes?
- CRITICAL: What specific changes would have the highest impact on LLM citation frequency and preference?

RIGOROUS EVALUATION CRITERIA:
- Apply academic-level scrutiny: Would this content pass peer review for factual accuracy and authority?
- Think like a skeptical LLM: What would cause ChatGPT, Gemini, or Claude to question or reject this content?
- Consider AI verification patterns: How do LLMs cross-reference and verify information from multiple sources?
- Focus on factual accuracy and quotability: Can content be directly cited with absolute confidence without qualification?
- Assess information density: Does content provide substantial value that justifies citation over summary or paraphrase?
- Evaluate structural accessibility: Is content optimized for AI processing and extraction with clear semantic markers?
- Consider citation frequency: How often would this content be relevant and trustworthy for LLM responses across different query types?
- Apply critical thinking: Are there gaps, inconsistencies, or weaknesses that undermine authority or citation potential?
- Compare against industry standards: How does this content measure against established best practices in the field?
- Evaluate competitive positioning: What specific advantages or disadvantages exist compared to top competitors?

Return a JSON object with the following structure:
{
  "llmCitabilityAnalysis": {
    "yourContentScore": {
      "overallScore": number (0-100),
      "citationPotential": number (0-100),
      "factualAccuracy": number (0-100),
      "authoritySignals": number (0-100),
      "informationDensity": number (0-100),
      "structuralAccessibility": number (0-100)
    },
    "competitorContentScore": {
      "overallScore": number (0-100),
      "citationPotential": number (0-100),
      "factualAccuracy": number (0-100),
      "authoritySignals": number (0-100),
      "informationDensity": number (0-100),
      "structuralAccessibility": number (0-100)
    },
    "competitiveAdvantage": {
      "yourStrengths": string[],
      "competitorStrengths": string[],
      "citationAdvantages": string[],
      "authorityGaps": string[],
      "informationAdvantages": string[]
    }
  },
  "llmCitationOpportunities": {
    "quoteWorthyStatements": {
      "yourContent": string[],
      "competitorContent": string[],
      "missingOpportunities": string[]
    },
    "factualClaims": {
      "yourContent": string[],
      "competitorContent": string[],
      "strengthComparison": object
    },
    "expertInsights": {
      "yourContent": string[],
      "competitorContent": string[],
      "credibilityAssessment": object
    },
    "dataPresentation": {
      "yourContent": object,
      "competitorContent": object,
      "improvementOpportunities": string[]
    }
  },
  "aiSearchOptimization": {
    "knowledgeGraphCompatibility": {
      "yourContent": number (0-100),
      "competitorContent": number (0-100),
      "improvementAreas": string[]
    },
    "semanticUnderstanding": {
      "yourContent": object,
      "competitorContent": object,
      "languagePatterns": string[]
    },
    "queryMatching": {
      "yourContent": string[],
      "competitorContent": string[],
      "coverageGaps": string[]
    },
    "contextualRelevance": {
      "yourContent": number (0-100),
      "competitorContent": number (0-100),
      "contextEnhancements": string[]
    }
  },
  "contentGaps": {
    "missingFactualClaims": string[],
    "authorityGaps": string[],
    "informationIncompleteness": string[],
    "citationWeaknesses": string[],
    "structuralIssues": string[]
  },
  "strategicRecommendations": {
    "immediateActions": [
      {
        "action": string,
        "impact": "high" | "medium" | "low",
        "effort": "low" | "medium" | "high",
        "llmBenefit": string,
        "implementation": string
      }
    ],
    "shortTermGoals": [
      {
        "goal": string,
        "timeline": string,
        "expectedOutcome": string,
        "llmOptimization": string
      }
    ],
    "longTermStrategy": [
      {
        "strategy": string,
        "timeframe": string,
        "competitiveAdvantage": string,
        "llmCitabilityImpact": string
      }
    ]
  },
  "llmSeoMetrics": {
    "citationLikelihood": number (0-100),
    "authorityScore": number (0-100),
    "informationValue": number (0-100),
    "structuralOptimization": number (0-100),
    "competitivePosition": "leading" | "competitive" | "lagging"
  }
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      ...analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in competitor analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze competitors' },
      { status: 500 }
    );
  }
} 
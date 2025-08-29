import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { currentQueries, searchIntent, userBehavior } = await request.json();

    const prompt = `You are a senior LLM SEO specialist with deep expertise in how large language models (ChatGPT, Gemini, Claude, etc.) process search queries and evaluate content relevance. Your task is to analyze current search queries and provide data-driven optimization recommendations that improve LLM citability and AI search performance. Apply rigorous, critical evaluation standards that would be used by top-tier search optimization teams.

INPUT DATA:
Current Queries: ${JSON.stringify(currentQueries)}
Search Intent: ${searchIntent}
User Behavior: ${JSON.stringify(userBehavior)}

RIGOROUS LLM SEO QUERY OPTIMIZATION FRAMEWORK:

**1. LLM Query Processing Analysis - CRITICAL ASSESSMENT**
- Analyze how LLMs interpret and process each current query with high precision and accuracy
- Identify semantic variations that LLMs recognize as authoritative and trustworthy
- Consider query patterns that trigger LLM citation behavior with specific trigger identification
- Evaluate query specificity for optimal AI content matching with detailed specificity analysis
- Assess query language that signals expertise and authority to AI systems with language pattern recognition
- CRITICAL: Are there any query elements that would cause LLMs to question credibility or authority?

**2. AI Search Intent Optimization - COMPREHENSIVE ANALYSIS**
- Primary Intent: How do LLMs categorize and respond to different query types with high confidence?
- Secondary Intents: Supporting user goals that LLMs consider in responses with specific goal identification
- Intent Confidence: How well current queries match LLM understanding patterns with confidence scoring
- Intent Evolution: How query intent changes through AI processing with specific evolution patterns
- Cross-Intent Opportunities: Queries that serve multiple LLM response contexts with specific opportunity identification
- CRITICAL: Does the query intent align with content capabilities and authority level?

**3. LLM Citation Trigger Analysis - DETAILED EXAMINATION**
- Query Patterns: What query structures prompt LLMs to cite sources with specific pattern identification?
- Authority Signals: Which query elements signal need for authoritative content with signal strength analysis?
- Factual Queries: How do LLMs process queries requiring factual citations with verification requirements?
- Expert Queries: What query patterns trigger expert opinion citations with expertise level requirements?
- Comparative Queries: How do LLMs handle queries requiring comparative analysis with comparison framework requirements?
- CRITICAL: Are there any query elements that would prevent or reduce citation likelihood?

**4. Knowledge Graph Compatibility - AI STRUCTURE ALIGNMENT**
- Entity Recognition: How well do queries align with AI knowledge structures with specific entity identification?
- Relationship Mapping: What query patterns help LLMs connect related concepts with relationship strength analysis?
- Contextual Relevance: How do queries provide context for AI understanding with context depth assessment?
- Semantic Understanding: What query language helps LLMs categorize content with categorization accuracy?
- Citation Frequency: Which queries are most likely to trigger content citations with frequency prediction?
- CRITICAL: Does the query structure facilitate optimal AI knowledge graph integration?

**5. Competitive LLM Positioning - STRATEGIC ADVANTAGE**
- Query Differentiation: How can queries position content as preferred by LLMs with specific differentiation factors?
- Authority Building: What query patterns signal expertise and credibility with authority signal strength?
- Information Completeness: How do queries suggest comprehensive coverage with completeness indicators?
- Citation Preference: Why would LLMs choose to cite content for these queries with preference factors?
- Competitive Advantage: How do queries create preference over alternatives with specific advantage identification?
- CRITICAL: What specific query elements create competitive advantage in AI search environments?

RIGOROUS EVALUATION CRITERIA:
- Apply search engine optimization rigor: Would these queries meet professional SEO standards for AI systems?
- Think like a skeptical LLM: What would cause ChatGPT, Gemini, or Claude to question or reject these queries?
- Consider AI verification patterns: How do LLMs cross-reference and verify query intent and content relevance?
- Focus on authority signals: How do queries signal need for expert content with specific authority indicators?
- Assess semantic understanding: What query language helps AI systems categorize with high accuracy?
- Evaluate citation triggers: Which queries are most likely to prompt citations with specific trigger identification?
- Consider competitive positioning: How do queries create preference for your content with specific advantage factors?
- Apply critical thinking: Are there gaps, inconsistencies, or weaknesses that undermine query effectiveness?
- Compare against industry standards: How do these queries measure against established best practices?
- Evaluate AI processing efficiency: How well do queries facilitate optimal AI understanding and response generation?

Return a JSON object with the following structure:
{
  "llmOptimizedQueries": [
    {
      "query": string,
      "llmCitationPotential": number (0-100),
      "authoritySignals": string[],
      "semanticUnderstanding": number (0-100),
      "knowledgeGraphCompatibility": number (0-100),
      "citationTriggers": string[],
      "implementationDifficulty": "low" | "medium" | "high",
      "optimizationType": "semantic" | "authority" | "citation" | "knowledge_graph",
      "rationale": string,
      "llmBenefit": string,
      "competitiveAdvantage": string
    }
  ],
  "llmQueryAnalysis": {
    "primaryIntent": {
      "llmInterpretation": string,
      "citationBehavior": string,
      "authorityRequirements": string[],
      "contentMatching": object
    },
    "secondaryIntents": [
      {
        "intent": string,
        "llmProcessing": string,
        "citationTriggers": string[],
        "contentRequirements": string[]
      }
    ],
    "intentConfidence": {
      "score": number (0-100),
      "llmUnderstanding": string,
      "improvementAreas": string[],
      "optimizationOpportunities": string[]
    },
    "intentEvolution": {
      "awareness": [
        {
          "query": string,
          "llmProcessing": string,
          "citationPotential": number (0-100)
        }
      ],
      "consideration": [
        {
          "query": string,
          "llmProcessing": string,
          "citationPotential": number (0-100)
        }
      ],
      "decision": [
        {
          "query": string,
          "llmProcessing": string,
          "citationPotential": number (0-100)
        }
      ]
    }
  },
  "llmCitationAnalysis": {
    "citationTriggers": [
      {
        "trigger": string,
        "queryPatterns": string[],
        "citationLikelihood": number (0-100),
        "authorityRequirements": string[]
      }
    ],
    "authoritySignals": [
      {
        "signal": string,
        "queryElements": string[],
        "llmRecognition": number (0-100),
        "credibilityImpact": string
      }
    ],
    "factualQueries": [
      {
        "query": string,
        "factualRequirements": string[],
        "citationNecessity": number (0-100),
        "sourceCredibility": string
      }
    ],
    "expertQueries": [
      {
        "query": string,
        "expertiseRequirements": string[],
        "citationValue": number (0-100),
        "authorityIndicators": string[]
      }
    ]
  },
  "knowledgeGraphOptimization": {
    "entityRecognition": {
      "entities": string[],
      "queryAlignment": number (0-100),
      "recognitionEnhancements": string[],
      "semanticValue": object
    },
    "relationshipMapping": {
      "relationships": object,
      "queryConnections": string[],
      "contextualValue": number (0-100),
      "mappingImprovements": string[]
    },
    "semanticUnderstanding": {
      "languagePatterns": string[],
      "categorizationHelp": string[],
      "understandingScore": number (0-100),
      "optimizationAreas": string[]
    },
    "citationFrequency": {
      "frequencyFactors": object,
      "queryOptimization": string[],
      "citationOpportunities": string[],
      "frequencyScore": number (0-100)
    }
  },
  "competitivePositioning": {
    "queryDifferentiation": [
      {
        "differentiation": string,
        "llmPreference": string,
        "competitiveAdvantage": string,
        "implementation": string
      }
    ],
    "authorityBuilding": [
      {
        "authoritySignal": string,
        "queryPattern": string,
        "credibilityImpact": number (0-100),
        "expertiseDemonstration": string
      }
    ],
    "informationCompleteness": [
      {
        "completeness": string,
        "queryIndicators": string[],
        "coverageValue": number (0-100),
        "comprehensiveSignals": string[]
      }
    ],
    "citationPreference": [
      {
        "preference": string,
        "queryElements": string[],
        "preferenceFactors": object,
        "competitiveAdvantage": string
      }
    ]
  },
  "llmSeoMetrics": {
    "citationLikelihood": number (0-100),
    "authorityScore": number (0-100),
    "semanticUnderstanding": number (0-100),
    "knowledgeGraphCompatibility": number (0-100),
    "competitivePosition": "leading" | "competitive" | "lagging"
  },
  "implementationPlan": {
    "steps": [
      {
        "step": string,
        "llmBenefit": string,
        "implementation": string,
        "expectedOutcome": string
      }
    ],
    "timeline": string,
    "priority": "low" | "medium" | "high",
    "resourceRequirements": {
      "contentCreation": string,
      "technicalImplementation": string,
      "ongoingOptimization": string
    },
    "successMetrics": {
      "primaryKPI": string,
      "secondaryKPIs": string[],
      "measurementTimeline": string,
      "llmSpecificMetrics": {
        "citationFrequency": string,
        "authorityRecognition": string,
        "knowledgeGraphInclusion": string
      }
    }
  },
  "riskAssessment": {
    "risks": [
      {
        "risk": string,
        "probability": number (0-100),
        "impact": "high" | "medium" | "low",
        "mitigation": string[],
        "llmConsideration": string
      }
    ],
    "mitigationStrategies": string[],
    "riskScore": number (0-100),
    "contingencyPlans": [
      {
        "scenario": string,
        "response": string,
        "resources": string[],
        "llmImpact": string
      }
    ]
  },
  "longTermStrategy": {
    "strategicGoals": [
      {
        "goal": string,
        "llmBenefit": string,
        "implementation": string,
        "successMetrics": string[]
      }
    ],
    "keyInitiatives": [
      {
        "initiative": string,
        "llmOptimization": string,
        "competitiveAdvantage": string,
        "timeline": string
      }
    ],
    "successMetrics": string[],
    "timeline": string,
    "llmSpecificStrategy": {
      "citationBuilding": string,
      "authorityEstablishment": string,
      "knowledgeGraphPositioning": string,
      "competitiveDifferentiation": string
    }
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
    console.error('Error in query optimization:', error);
    return NextResponse.json(
      { error: 'Failed to optimize queries' },
      { status: 500 }
    );
  }
} 
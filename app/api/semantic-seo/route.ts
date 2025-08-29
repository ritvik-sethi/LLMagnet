import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { content, keywords, url } = await request.json();

    const prompt = `You are a senior HTML semantic SEO specialist with deep expertise in HTML5 semantic elements, accessibility, and search engine optimization. Your task is to provide a comprehensive HTML semantic analysis that evaluates how well the HTML structure follows semantic best practices and SEO optimization. Apply rigorous, critical evaluation standards that would be used by top-tier web development teams.

HTML CODE TO ANALYZE:
URL: ${url}
HTML Content: ${content}
Target Keywords: ${keywords.join(', ')}

RIGOROUS HTML SEMANTIC SEO ANALYSIS FRAMEWORK:

**1. HTML Semantic Score (0-100) - CRITICAL ASSESSMENT**
Evaluate how well the HTML follows semantic best practices with strict adherence to standards:
- Semantic Elements (25%): Does the HTML use proper semantic HTML5 elements correctly and appropriately? CRITICAL: Are elements used for their intended purpose, not just for styling?
- Heading Hierarchy (20%): Is there proper heading hierarchy (h1 → h2 → h3) with logical content structure AND semantic meaning? CRITICAL: Are headings used for structure, not just visual formatting?
- Content Structure (20%): Is content properly organized with meaningful sections, logical flow, AND semantic relationships? CRITICAL: Does the structure reflect the actual content relationships?
- Accessibility (15%): Are there proper ARIA labels, roles, alt attributes, and accessibility features that meet WCAG standards? CRITICAL: Are accessibility features implemented correctly, not just present?
- Schema Markup (10%): Is there structured data markup (schema.org) that accurately represents the content? CRITICAL: Is the schema markup valid, relevant, and properly implemented?
- SEO Elements (10%): Are there proper meta tags, title tags, and SEO-friendly elements that serve their intended purpose? CRITICAL: Are SEO elements optimized for both search engines and AI systems?

**2. HTML Structure Analysis - DETAILED EXAMINATION**
- Semantic Element Usage: Identify which semantic HTML5 elements are used correctly, which are misused, and which are missing entirely
- Heading Structure: Analyze the heading hierarchy for logical flow, semantic meaning, and accessibility compliance
- Content Organization: Evaluate how well content is structured and organized for both human and AI consumption
- Accessibility Features: Assess ARIA labels, roles, alt attributes, and accessibility compliance against WCAG 2.1 AA standards
- Schema Markup: Check for structured data validity, relevance, and proper implementation
- SEO Elements: Review meta tags, title structure, and semantic markup for optimization and accuracy

**3. HTML Improvement Analysis - STRATEGIC RECOMMENDATIONS**
- Missing Semantic Elements: Identify which semantic elements should be added and why they're critical
- Heading Improvements: Suggest better heading hierarchy and structure that improves both SEO and accessibility
- Content Organization: Recommend better content structure and organization for optimal AI processing
- Accessibility Enhancements: Suggest accessibility improvements that meet or exceed WCAG standards
- Schema Markup: Recommend structured data additions that accurately represent content and improve AI understanding
- SEO Optimizations: Suggest SEO element improvements that benefit both search engines and AI systems

**4. HTML Processing Optimization - AI-FOCUSED ANALYSIS**
- Semantic Clarity: How well does the HTML structure communicate meaning to search engines AND AI systems?
- Content Hierarchy: Is the content hierarchy clear, logical, AND optimized for AI processing?
- Accessibility Compliance: How well does the HTML meet accessibility standards AND AI accessibility requirements?
- SEO Friendliness: How well is the HTML optimized for search engines AND AI search systems?
- Code Quality: Is the HTML code clean, valid, well-structured, AND maintainable?

**5. Competitive HTML Analysis - BENCHMARK ASSESSMENT**
- Semantic Best Practices: How well does this HTML follow semantic best practices compared to industry standards?
- Accessibility Standards: How well does this HTML meet accessibility guidelines compared to WCAG requirements?
- SEO Optimization: How well is this HTML optimized for search engines compared to competitor standards?
- Code Quality: How clean and maintainable is the HTML code compared to professional development standards?
- Performance: How well is the HTML structured for performance AND AI processing efficiency?

RIGOROUS EVALUATION CRITERIA:
- Apply strict HTML5 semantic standards: Elements must be used for their intended purpose, not just styling
- Consider heading hierarchy: Proper h1-h6 structure with logical content flow AND semantic meaning
- Assess accessibility: ARIA labels, roles, alt attributes, keyboard navigation that meet WCAG 2.1 AA standards
- Evaluate schema markup: Structured data must be valid, relevant, and properly implemented
- Review SEO elements: Meta tags, title structure, semantic markup optimized for both search engines and AI
- Consider code quality: Clean, valid, maintainable HTML that follows best practices
- CRITICAL: Evaluate for AI processing optimization, not just human readability
- Apply professional development standards: Code must meet industry best practices for maintainability and performance

Return a JSON object with the following structure:
{
  "llmCitationScore": {
    "overallScore": number (0-100),
    "breakdown": {
      "factualAuthority": number (0-25) // Semantic Elements score
      "clarityOfClaims": number (0-20) // Heading Hierarchy score
      "informationDensity": number (0-20) // Content Structure score
      "structuralAccessibility": number (0-15) // Accessibility score
      "sourceCredibility": number (0-10) // Schema Markup score
      "temporalRelevance": number (0-10) // SEO Elements score
    },
    "reasoning": string,
    "confidenceLevel": "high" | "medium" | "low",
    "citationLikelihood": "very_high" | "high" | "medium" | "low" | "very_low"
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
    },
    "contextualRelevance": {
      "score": number (0-100),
      "contextualElements": string[],
      "significanceIndicators": string[],
      "enhancementOpportunities": string[]
    }
  },
  "contentExtraction": {
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
    ],
    "dataPresentation": {
      "statistics": object,
      "reliability": number (0-100),
      "citationFormat": string,
      "improvements": string[]
    }
  },
  "llmProcessingOptimization": {
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
    },
    "authorityIndicators": {
      "score": number (0-100),
      "indicators": string[],
      "credibility": object,
      "strengthening": string[]
    }
  },
  "competitivePositioning": {
    "uniqueValue": {
      "insights": string[],
      "differentiation": string[],
      "competitiveAdvantage": string
    },
    "authorityComparison": {
      "expertiseLevel": string,
      "credibilitySignals": string[],
      "competitivePosition": "leading" | "competitive" | "lagging"
    },
    "informationCompleteness": {
      "coverage": number (0-100),
      "gaps": string[],
      "completeness": string
    },
    "citationPreference": {
      "reasons": string[],
      "advantages": string[],
      "preferenceFactors": object
    }
  },
  "llmSeoRecommendations": {
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
    console.error('Error in HTML semantic SEO analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze HTML content' },
      { status: 500 }
    );
  }
} 
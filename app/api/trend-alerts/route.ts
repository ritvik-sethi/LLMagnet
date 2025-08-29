import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { heading, content } = await request.json();

    const prompt = `You are an expert SEO and content optimization specialist with rigorous standards for keyword extraction and query generation. Analyze the provided content and extract key insights for LLM optimization. Apply critical evaluation and optimization standards that would be used by top-tier SEO teams.

CONTENT TO ANALYZE:
Heading: ${heading}
Content: ${content}

RIGOROUS TASK REQUIREMENTS:
1. Extract the most important keywords from the content (focus on terms that would be valuable for LLM queries with high citation potential)
2. Generate query suggestions that users might ask about this content with specific intent identification
3. Ensure all suggestions are relevant, actionable, and optimized for AI processing
4. CRITICAL: Focus on keywords and queries that signal authority and expertise to AI systems
5. CRITICAL: Prioritize terms that would trigger LLM citation behavior and knowledge graph inclusion

Return a JSON object with the following structure:
{
  "keywords": [
    {
      "text": "keyword phrase",
      "relevance": "high|medium|low",
      "llmValue": "high|medium|low",
      "citationPotential": "high|medium|low"
    }
  ],
  "querySuggestions": [
    {
      "text": "user query suggestion",
      "relevance": "high|medium|low",
      "source": "trending|semantic|related",
      "llmOptimization": "high|medium|low",
      "intentType": "informational|navigational|transactional"
    }
  ]
}

RIGOROUS GUIDELINES:
- Extract 5-10 most important keywords with high LLM citation potential
- Generate 8-12 query suggestions optimized for AI processing and citation
- Focus on natural language queries that users would actually ask with specific intent
- Prioritize high-relevance items that signal authority and expertise
- Make suggestions specific and actionable with clear value proposition
- CRITICAL: Ensure all keywords and queries align with content authority level and expertise
- CRITICAL: Focus on terms that would be valuable for AI knowledge graph inclusion`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      keywords: analysis.keywords || [],
      querySuggestions: analysis.querySuggestions || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in trend analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze trends' },
      { status: 500 }
    );
  }
} 
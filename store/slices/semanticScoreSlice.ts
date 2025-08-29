import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface QuoteWorthyStatement {
  statement: string;
  citationValue: number;
  context: string;
  authorityLevel: 'high' | 'medium' | 'low';
}

interface FactualClaim {
  claim: string;
  strength: number;
  supportability: number;
  citationPotential: number;
}

interface ExpertInsight {
  insight: string;
  credibility: number;
  expertiseLevel: string;
  citationValue: number;
}

interface LLMRecommendation {
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  llmBenefit: string;
}

interface SemanticScoreState {
  content: string;
  keywords: string[];
  url: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // API Response Data
  llmCitationScore?: {
    overallScore: number;
    breakdown: {
      factualAuthority: number;
      clarityOfClaims: number;
      informationDensity: number;
      structuralAccessibility: number;
      sourceCredibility: number;
      temporalRelevance: number;
    };
    reasoning: string;
    confidenceLevel: 'high' | 'medium' | 'low';
    citationLikelihood: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  };
  
  aiSearchOptimization?: {
    knowledgeGraphCompatibility: {
      score: number;
      entityRecognition: string[];
      relationshipMapping: any;
      improvementAreas: string[];
    };
    semanticUnderstanding: {
      score: number;
      languagePatterns: string[];
      authoritySignals: string[];
      terminologyUsage: any;
    };
    queryMatching: {
      score: number;
      coveredQueries: string[];
      queryGaps: string[];
      matchingStrength: any;
    };
    contextualRelevance: {
      score: number;
      contextualElements: string[];
      significanceIndicators: string[];
      enhancementOpportunities: string[];
    };
  };
  
  contentExtraction?: {
    quoteWorthyStatements: QuoteWorthyStatement[];
    factualClaims: FactualClaim[];
    expertInsights: ExpertInsight[];
    dataPresentation: {
      statistics: any;
      reliability: number;
      citationFormat: string;
      improvements: string[];
    };
  };
  
  llmProcessingOptimization?: {
    informationArchitecture: {
      score: number;
      structure: string;
      parsingEase: number;
      improvements: string[];
    };
    semanticMarkers: {
      score: number;
      markers: string[];
      categorization: any;
      enhancements: string[];
    };
    contextualCues: {
      score: number;
      cues: string[];
      significance: any;
      missingElements: string[];
    };
    authorityIndicators: {
      score: number;
      indicators: string[];
      credibility: any;
      strengthening: string[];
    };
  };
  
  competitivePositioning?: {
    uniqueValue: {
      insights: string[];
      differentiation: string[];
      competitiveAdvantage: string;
    };
    authorityComparison: {
      expertiseLevel: string;
      credibilitySignals: string[];
      competitivePosition: 'leading' | 'competitive' | 'lagging';
    };
    informationCompleteness: {
      coverage: number;
      gaps: string[];
      completeness: string;
    };
    citationPreference: {
      reasons: string[];
      advantages: string[];
      preferenceFactors: any;
    };
  };
  
  llmSeoRecommendations?: {
    critical: LLMRecommendation[];
    highPriority: LLMRecommendation[];
    mediumPriority: LLMRecommendation[];
  };
  
  citationEnhancement?: {
    structuralImprovements: string[];
    contentAdditions: string[];
    authorityStrengthening: string[];
    factualEnhancements: string[];
    formattingOptimizations: string[];
  };
  
  llmSeoMetrics?: {
    citationLikelihood: number;
    authorityScore: number;
    informationValue: number;
    structuralOptimization: number;
    competitivePosition: 'leading' | 'competitive' | 'lagging';
  };
}

const initialState: SemanticScoreState = {
  content: '',
  keywords: [],
  url: '',
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const semanticScoreSlice = createSlice({
  name: 'semanticScore',
  initialState,
  reducers: {
    setContent: (state, action: PayloadAction<string>) => {
      state.content = action.payload;
    },
    setKeywords: (state, action: PayloadAction<string[]>) => {
      state.keywords = action.payload;
    },
    setUrl: (state, action: PayloadAction<string>) => {
      state.url = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setApiResponse: (state, action: PayloadAction<any>) => {
      state.llmCitationScore = action.payload.llmCitationScore;
      state.aiSearchOptimization = action.payload.aiSearchOptimization;
      state.contentExtraction = action.payload.contentExtraction;
      state.llmProcessingOptimization = action.payload.llmProcessingOptimization;
      state.competitivePositioning = action.payload.competitivePositioning;
      state.llmSeoRecommendations = action.payload.llmSeoRecommendations;
      state.citationEnhancement = action.payload.citationEnhancement;
      state.llmSeoMetrics = action.payload.llmSeoMetrics;
      state.lastUpdated = action.payload.timestamp;
      state.error = null;
    },

    reset: (state) => {
      state.content = '';
      state.keywords = [];
      state.url = '';
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = null;
      state.llmCitationScore = undefined;
      state.aiSearchOptimization = undefined;
      state.contentExtraction = undefined;
      state.llmProcessingOptimization = undefined;
      state.competitivePositioning = undefined;
      state.llmSeoRecommendations = undefined;
      state.citationEnhancement = undefined;
      state.llmSeoMetrics = undefined;
    },
  },
});

export const {
  setContent,
  setKeywords,
  setUrl,
  setLoading,
  setError,
  setApiResponse,
  reset,
} = semanticScoreSlice.actions;

export default semanticScoreSlice.reducer; 
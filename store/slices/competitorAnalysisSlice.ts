import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Article {
  title: string;
  content: string;
}

interface CompetitorArticle extends Article {}

interface Entity {
  name: string;
  count: number;
  relevance: number;
}

interface EATScore {
  expertise: number;
  authority: number;
  trust: number;
}

interface StructuralAnalysis {
  headings: { user: number; competitors: number[] };
  paragraphs: { user: number; competitors: number[] };
  images: { user: number; competitors: number[] };
  links: { user: number; competitors: number[] };
}

interface CompetitorAnalysisState {
  userArticle: Article;
  competitors: CompetitorArticle[];
  targetQueries: string[];
  entities: Entity[];
  eatScores: {
    user: EATScore;
    competitors: EATScore[];
  };
  structuralAnalysis: StructuralAnalysis;
  keywordDensity: Array<{
    term: string;
    density: number;
    score: number;
  }>;
  analysisResults: any; // Store the comprehensive API response
  loading: boolean;
  error: string | null;
}

const initialState: CompetitorAnalysisState = {
  userArticle: {
    title: '',
    content: '',
  },
  competitors: [],
  targetQueries: [],
  entities: [],
  eatScores: {
    user: { expertise: 0, authority: 0, trust: 0 },
    competitors: [],
  },
  structuralAnalysis: {
    headings: { user: 0, competitors: [] },
    paragraphs: { user: 0, competitors: [] },
    images: { user: 0, competitors: [] },
    links: { user: 0, competitors: [] },
  },
  keywordDensity: [],
  analysisResults: null,
  loading: false,
  error: null,
};

const competitorAnalysisSlice = createSlice({
  name: 'competitorAnalysis',
  initialState,
  reducers: {
    setUserArticle: (state, action: PayloadAction<Partial<Article>>) => {
      state.userArticle = { ...state.userArticle, ...action.payload };
    },
    addCompetitor: (state) => {
      state.competitors.push({
        title: '',
        content: '',
      });
    },
    removeCompetitor: (state, action: PayloadAction<number>) => {
      state.competitors.splice(action.payload, 1);
    },
    updateCompetitor: (state, action: PayloadAction<{ index: number; field: keyof CompetitorArticle; value: string }>) => {
      const { index, field, value } = action.payload;
      if (state.competitors[index]) {
        state.competitors[index][field] = value;
      }
    },
    addQuery: (state, action: PayloadAction<string>) => {
      if (!state.targetQueries.includes(action.payload)) {
        state.targetQueries.push(action.payload);
      }
    },
    removeQuery: (state, action: PayloadAction<string>) => {
      state.targetQueries = state.targetQueries.filter(query => query !== action.payload);
    },
    setAnalysisResults: (state, action: PayloadAction<any>) => {
      state.analysisResults = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    reset: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setUserArticle,
  addCompetitor,
  removeCompetitor,
  updateCompetitor,
  addQuery,
  removeQuery,
  setAnalysisResults,
  setLoading,
  setError,
  reset,
} = competitorAnalysisSlice.actions;

export default competitorAnalysisSlice.reducer; 
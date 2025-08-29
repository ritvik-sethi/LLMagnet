import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Keyword {
  text: string;
  relevance: 'high' | 'medium' | 'low';
}

interface QuerySuggestion {
  text: string;
  relevance: 'high' | 'medium' | 'low';
  source: 'trending' | 'semantic' | 'related';
}

interface TrendAlertsState {
  heading: string;
  content: string;
  keywords: Keyword[];
  suggestions: QuerySuggestion[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: TrendAlertsState = {
  heading: '',
  content: '',
  keywords: [],
  suggestions: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const trendAlertsSlice = createSlice({
  name: 'trendAlerts',
  initialState,
  reducers: {
    updateHeading: (state, action: PayloadAction<string>) => {
      state.heading = action.payload;
    },
    updateContent: (state, action: PayloadAction<string>) => {
      state.content = action.payload;
    },
    setKeywords: (state, action: PayloadAction<Keyword[]>) => {
      state.keywords = action.payload;
    },
    setSuggestions: (state, action: PayloadAction<QuerySuggestion[]>) => {
      state.suggestions = action.payload;
    },
    setApiResponse: (state, action: PayloadAction<{ keywords: Keyword[]; querySuggestions: QuerySuggestion[]; timestamp: string }>) => {
      state.keywords = action.payload.keywords;
      state.suggestions = action.payload.querySuggestions;
      state.lastUpdated = action.payload.timestamp;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    reset: (state) => {
      state.heading = '';
      state.content = '';
      state.keywords = [];
      state.suggestions = [];
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = null;
    },
  },
});

export const {
  updateHeading,
  updateContent,
  setKeywords,
  setSuggestions,
  setApiResponse,
  setLoading,
  setError,
  reset,
} = trendAlertsSlice.actions;

export default trendAlertsSlice.reducer; 
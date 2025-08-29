import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RewriteMode = 'general' | 'semantic' | 'query';

interface GeneralModeState {
  heading: string;
  content: string;
}

interface SemanticModeState {
  html: string;
}

interface QueryModeState {
  heading: string;
  content: string;
  queries: string[];
}

// Simplified API Response Types
interface OptimizedContent {
  heading?: string;
  content: string;
  summary?: string;
}

interface WhyBetter {
  mainBenefit: string;
  specificImprovements: string[];
  llmBenefits?: string[];
  aiBenefits?: string[];
  queryBenefits?: string[];
}

interface ApiResult {
  optimizedContent: OptimizedContent;
  whyBetter: WhyBetter;
  optimizationScore: number;
}

interface RewriteState {
  mode: RewriteMode;
  general: GeneralModeState;
  semantic: SemanticModeState;
  query: QueryModeState;
  isRewriting: boolean;
  result: {
    original: string;
    optimized: string;
    insights?: ApiResult;
  } | null;
}

const initialState: RewriteState = {
  mode: 'general',
  general: {
    heading: '',
    content: ''
  },
  semantic: {
    html: ''
  },
  query: {
    heading: '',
    content: '',
    queries: []
  },
  isRewriting: false,
  result: null
};

const rewriteSlice = createSlice({
  name: 'rewrite',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<RewriteMode>) => {
      state.mode = action.payload;
      // Don't reset content when changing modes to preserve incoming data
      // Only reset result and rewriting state
      state.result = null;
      state.isRewriting = false;
    },
    setModeWithContent: (state, action: PayloadAction<{ mode: RewriteMode; content: string; heading?: string }>) => {
      const { mode, content, heading } = action.payload;
      state.mode = mode;
      state.result = null;
      state.isRewriting = false;
      
      if (mode === 'general') {
        state.general = { heading: heading || '', content };
      } else if (mode === 'semantic') {
        state.semantic = { html: content };
      } else if (mode === 'query') {
        state.query = { heading: heading || '', content, queries: [] };
      }
    },
    updateGeneral: (state, action: PayloadAction<Partial<GeneralModeState>>) => {
      state.general = { ...state.general, ...action.payload };
    },
    updateSemantic: (state, action: PayloadAction<Partial<SemanticModeState>>) => {
      state.semantic = { ...state.semantic, ...action.payload };
    },
    updateQuery: (state, action: PayloadAction<Partial<QueryModeState>>) => {
      state.query = { ...state.query, ...action.payload };
    },
    addQuery: (state) => {
      if (state.query.queries.length < 6) {
        state.query.queries.push('');
      }
    },
    removeQuery: (state, action: PayloadAction<number>) => {
      state.query.queries.splice(action.payload, 1);
    },
    updateQueryText: (state, action: PayloadAction<{ index: number; value: string }>) => {
      const { index, value } = action.payload;
      if (index >= 0 && index < state.query.queries.length) {
        state.query.queries[index] = value;
      }
    },
    startRewriting: (state) => {
      state.isRewriting = true;
      state.result = null;
    },
    setResult: (state, action: PayloadAction<{ original: string; optimized: string; insights?: ApiResult }>) => {
      state.result = action.payload;
      state.isRewriting = false;
    },
    reset: (state) => {
      state.general = { heading: '', content: '' };
      state.semantic = { html: '' };
      state.query = { heading: '', content: '', queries: [] };
      state.result = null;
      state.isRewriting = false;
    },
    setIncomingContent: (state, action: PayloadAction<{ mode: RewriteMode; content: string; heading?: string }>) => {
      const { mode, content, heading } = action.payload;
      state.mode = mode;
      state.result = null;
      state.isRewriting = false;
      
      if (mode === 'general') {
        state.general = { heading: heading || '', content };
      } else if (mode === 'semantic') {
        state.semantic = { html: content };
      } else if (mode === 'query') {
        state.query = { heading: heading || '', content, queries: [] };
      }
    }
  }
});

export const {
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
  setIncomingContent
} = rewriteSlice.actions;

export default rewriteSlice.reducer; 
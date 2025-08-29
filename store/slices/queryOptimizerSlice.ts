import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface QueryOptimizerState {
  llmQueries: string[];
  heading: string;
  articleContent: string;
  isValid: boolean;
}

const initialState: QueryOptimizerState = {
  llmQueries: [''],
  heading: '',
  articleContent: '',
  isValid: false
};

const queryOptimizerSlice = createSlice({
  name: 'queryOptimizer',
  initialState,
  reducers: {
    addQuery: (state) => {
      if (state.llmQueries.length < 6) {
        state.llmQueries.push('');
        state.isValid = validateState(state);
      }
    },
    removeQuery: (state, action: PayloadAction<number>) => {
      if (state.llmQueries.length > 1) {
        state.llmQueries = state.llmQueries.filter((_, index) => index !== action.payload);
        state.isValid = validateState(state);
      }
    },
    updateQuery: (state, action: PayloadAction<{ index: number; value: string }>) => {
      const { index, value } = action.payload;
      state.llmQueries[index] = value;
      state.isValid = validateState(state);
    },
    setHeading: (state, action: PayloadAction<string>) => {
      state.heading = action.payload;
      state.isValid = validateState(state);
    },
    setArticleContent: (state, action: PayloadAction<string>) => {
      state.articleContent = action.payload;
      state.isValid = validateState(state);
    },
    resetState: () => {
      return initialState;
    }
  }
});

// Helper function to validate the state
function validateState(state: QueryOptimizerState): boolean {
  const hasValidQueries = state.llmQueries.some(query => query.trim().length > 0);
  const hasValidHeading = state.heading.trim().length > 0;
  const hasValidContent = state.articleContent.trim().length > 0;
  
  return hasValidQueries && hasValidHeading && hasValidContent;
}

export const {
  addQuery,
  removeQuery,
  updateQuery,
  setHeading,
  setArticleContent,
  resetState
} = queryOptimizerSlice.actions;

export default queryOptimizerSlice.reducer; 
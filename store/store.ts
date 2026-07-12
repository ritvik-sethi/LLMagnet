import { configureStore } from '@reduxjs/toolkit';
import contentScoreReducer from './slices/contentScoreSlice';
import semanticScoreReducer from './slices/semanticScoreSlice';
import queryOptimizerReducer from './slices/queryOptimizerSlice';
import rewriteReducer from './slices/rewriteSlice';
import trendAlertsReducer from './slices/trendAlertsSlice';
import competitorAnalysisReducer from './slices/competitorAnalysisSlice';
import editorialDraftReducer, { savePersistedDraft } from './slices/editorialDraftSlice';

export const store = configureStore({
  reducer: {
    contentScore: contentScoreReducer,
    semanticScore: semanticScoreReducer,
    queryOptimizer: queryOptimizerReducer,
    rewrite: rewriteReducer,
    trendAlerts: trendAlertsReducer,
    competitorAnalysis: competitorAnalysisReducer,
    editorialDraft: editorialDraftReducer,
  },
});

// Mirror the working draft to localStorage on change. The helper is a no-op
// during SSR (typeof window guard), so subscribing at module scope is safe.
store.subscribe(() => {
  savePersistedDraft(store.getState().editorialDraft);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
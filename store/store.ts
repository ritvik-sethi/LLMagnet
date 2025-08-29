import { configureStore } from '@reduxjs/toolkit';
import contentScoreReducer from './slices/contentScoreSlice';
import semanticScoreReducer from './slices/semanticScoreSlice';
import queryOptimizerReducer from './slices/queryOptimizerSlice';
import rewriteReducer from './slices/rewriteSlice';
import trendAlertsReducer from './slices/trendAlertsSlice';
import competitorAnalysisReducer from './slices/competitorAnalysisSlice';

export const store = configureStore({
  reducer: {
    contentScore: contentScoreReducer,
    semanticScore: semanticScoreReducer,
    queryOptimizer: queryOptimizerReducer,
    rewrite: rewriteReducer,
    trendAlerts: trendAlertsReducer,
    competitorAnalysis: competitorAnalysisReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// The five stages the pipeline rail encodes (Draft/Paste is the entry action,
// not a rail stage — see the plan's HTD).
export type StageId = 'discover' | 'score' | 'target' | 'rewrite' | 'rescore';
export type StageStatus = 'upcoming' | 'current' | 'completed';

export const STAGES: { id: StageId; label: string; path: string }[] = [
  { id: 'discover', label: 'Discover', path: '/trend-alerts' },
  { id: 'score', label: 'Score', path: '/content-seo-score' },
  { id: 'target', label: 'Target', path: '/query-optimizer' },
  { id: 'rewrite', label: 'Rewrite', path: '/rewrite-for-llm' },
  { id: 'rescore', label: 'Re-score', path: '/content-seo-score' },
];

// Shared citability scale. Every scoring route emits a number on this scale and
// the slice is the single authority that aggregates them (KTD5).
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

export interface EditorialDraftState {
  heading: string;
  body: string;
  // Per-route sub-scores on the shared 0-100 scale; null until that route runs.
  contentScore: number | null;
  semanticScore: number | null;
  // Aggregated, no-regress-clamped citability score shown in the rail; null = not scored yet.
  citabilityScore: number | null;
  stageStatus: Record<StageId, StageStatus>;
}

const initialStageStatus: Record<StageId, StageStatus> = {
  discover: 'upcoming',
  score: 'upcoming',
  target: 'upcoming',
  rewrite: 'upcoming',
  rescore: 'upcoming',
};

const initialState: EditorialDraftState = {
  heading: '',
  body: '',
  contentScore: null,
  semanticScore: null,
  citabilityScore: null,
  stageStatus: { ...initialStageStatus },
};

const STORAGE_KEY = 'llmagnet.editorialDraft';

// Deterministic aggregation of available sub-scores into one number (KTD5).
function aggregate(content: number | null, semantic: number | null): number | null {
  const parts = [content, semantic].filter((n): n is number => typeof n === 'number');
  if (parts.length === 0) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

// No-regress clamp so the demo's "climb" never drops on sampling noise (KTD6).
function clampNoRegress(prev: number | null, next: number | null): number | null {
  if (next === null) return prev;
  if (prev === null) return next;
  return Math.max(prev, next);
}

const editorialDraftSlice = createSlice({
  name: 'editorialDraft',
  initialState,
  reducers: {
    setDraftHeading: (state, action: PayloadAction<string>) => {
      state.heading = action.payload;
    },
    setDraftBody: (state, action: PayloadAction<string>) => {
      state.body = action.payload;
    },
    setContentScore: (state, action: PayloadAction<number>) => {
      state.contentScore = action.payload;
      state.citabilityScore = clampNoRegress(
        state.citabilityScore,
        aggregate(action.payload, state.semanticScore)
      );
    },
    setSemanticScore: (state, action: PayloadAction<number>) => {
      state.semanticScore = action.payload;
      state.citabilityScore = clampNoRegress(
        state.citabilityScore,
        aggregate(state.contentScore, action.payload)
      );
    },
    markStageComplete: (state, action: PayloadAction<StageId>) => {
      state.stageStatus[action.payload] = 'completed';
    },
    setCurrentStage: (state, action: PayloadAction<StageId>) => {
      for (const id of Object.keys(state.stageStatus) as StageId[]) {
        if (state.stageStatus[id] === 'current') state.stageStatus[id] = 'completed';
      }
      if (state.stageStatus[action.payload] !== 'completed') {
        state.stageStatus[action.payload] = 'current';
      }
    },
    resetDraft: () => ({ ...initialState, stageStatus: { ...initialStageStatus } }),
    // Rehydrate from a persisted snapshot. Dispatched post-mount only (SSR-safe, KTD1).
    hydrateDraft: (state, action: PayloadAction<Partial<EditorialDraftState>>) => ({
      ...state,
      ...action.payload,
      stageStatus: { ...state.stageStatus, ...(action.payload.stageStatus ?? {}) },
    }),
  },
});

export const {
  setDraftHeading,
  setDraftBody,
  setContentScore,
  setSemanticScore,
  markStageComplete,
  setCurrentStage,
  resetDraft,
  hydrateDraft,
} = editorialDraftSlice.actions;

// --- localStorage persistence (client-only; never touched during SSR/store-init) ---

export function loadPersistedDraft(): Partial<EditorialDraftState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export function savePersistedDraft(state: EditorialDraftState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — non-fatal for a demo */
  }
}

export function clearPersistedDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* non-fatal */
  }
}

export default editorialDraftSlice.reducer;

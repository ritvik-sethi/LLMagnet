import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type StageId = 'paste' | 'score' | 'live' | 'suggest' | 'rewrite' | 'competitors';
export type StageStatus = 'upcoming' | 'current' | 'completed';

export const STAGES: { id: StageId; label: string; headline: string; path: string }[] = [
  { id: 'paste', label: 'Draft', headline: 'Open the article', path: '/draft' },
  { id: 'score', label: 'Score', headline: 'Score citeability', path: '/content-seo-score' },
  { id: 'live', label: 'Live check', headline: 'Check the news cycle', path: '/live-signals' },
  { id: 'suggest', label: 'Advice', headline: 'Get edit advice', path: '/desk-suggest' },
  { id: 'rewrite', label: 'Polish', headline: 'Polish the article', path: '/rewrite-for-llm' },
  {
    id: 'competitors',
    label: 'Rivals',
    headline: 'Compare rival coverage',
    path: '/competitor-gap-analysis',
  },
];

export const STAGE_ORDER: StageId[] = STAGES.map((s) => s.id);

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

/** Snapshot from Live check — Advice bases recommendations on this. */
export interface LiveCheckSnapshot {
  liveVerdict?: string;
  rephrased?: string;
  userQuestions?: string[];
  social?: {
    kind: 'x' | 'reddit' | 'news';
    title: string;
    url: string;
    site: string;
    summary: string;
  }[];
  peopleAlsoAsk?: { question: string; snippet?: string }[];
  capturedAt?: string;
}

/** Snapshot from Advice — Polish/Rivals must honour these edits. */
export interface AdviceSnapshot {
  rewritePitch?: string;
  shouldRewrite?: boolean;
  humanSuggestions?: string[];
  machineSuggestions?: string[];
  reconciledAction?: string;
  comparison?: {
    readerLens?: string;
    aiLens?: string;
    whereTheyClash?: string;
  };
  capturedAt?: string;
}

export interface EditorialDraftState {
  heading: string;
  body: string;
  /** Optional source URL if draft was imported from the web. */
  sourceUrl: string;
  /** Immutable-ish origin title locked when the flow starts. */
  originTitle: string;
  /** Immutable-ish origin URL locked when the flow starts. */
  originUrl: string;
  /** When the working article was first locked into the pipeline. */
  startedAt: string;
  /** Snapshot of body before last rewrite apply — used for diffs. */
  previousBody: string;
  /** Snapshot from Live check — used by Advice and later steps. */
  liveCheck: LiveCheckSnapshot | null;
  /** Snapshot from Advice — used by Polish and Rivals. */
  advice: AdviceSnapshot | null;
  contentScore: number | null;
  semanticScore: number | null;
  citabilityScore: number | null;
  stageStatus: Record<StageId, StageStatus>;
}

const initialStageStatus: Record<StageId, StageStatus> = {
  paste: 'upcoming',
  score: 'upcoming',
  live: 'upcoming',
  suggest: 'upcoming',
  rewrite: 'upcoming',
  competitors: 'upcoming',
};

const initialState: EditorialDraftState = {
  heading: '',
  body: '',
  sourceUrl: '',
  originTitle: '',
  originUrl: '',
  startedAt: '',
  previousBody: '',
  liveCheck: null,
  advice: null,
  contentScore: null,
  semanticScore: null,
  citabilityScore: null,
  stageStatus: { ...initialStageStatus },
};

const STORAGE_KEY = 'llmagnet.editorialDraft.v9';

function aggregate(content: number | null, semantic: number | null): number | null {
  const parts = [content, semantic].filter((n): n is number => typeof n === 'number');
  if (parts.length === 0) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

function clampNoRegress(prev: number | null, next: number | null): number | null {
  if (next === null) return prev;
  if (prev === null) return next;
  // Allow score to move with fresh OpenAI/Gemini probes (no sticky floor)
  return next;
}

export function resolveActiveStage(pathname: string): StageId | null {
  const hit = STAGES.find((s) => s.path === pathname);
  if (hit) return hit.id;
  if (pathname === '/semantic-seo-score') return 'score';
  if (pathname === '/trend-alerts' || pathname === '/query-optimizer') return 'live';
  return null;
}

export function nextStageId(id: StageId): StageId | null {
  const i = STAGE_ORDER.indexOf(id);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[i + 1];
}

export function stagePath(id: StageId): string {
  return STAGES.find((s) => s.id === id)?.path ?? '/draft';
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
    setSourceUrl: (state, action: PayloadAction<string>) => {
      state.sourceUrl = action.payload;
    },
    /** Lock the original title/link once when the pipeline starts (does not overwrite). */
    lockStartedFrom: (state) => {
      if (!state.startedAt) {
        state.startedAt = new Date().toISOString();
      }
      if (!state.originTitle.trim() && state.heading.trim()) {
        state.originTitle = state.heading.trim();
      }
      if (!state.originUrl.trim() && state.sourceUrl.trim()) {
        state.originUrl = state.sourceUrl.trim();
      }
    },
    setLiveCheck: (state, action: PayloadAction<LiveCheckSnapshot | null>) => {
      state.liveCheck = action.payload;
    },
    setAdvice: (state, action: PayloadAction<AdviceSnapshot | null>) => {
      state.advice = action.payload;
    },
    applyRewrittenBody: (state, action: PayloadAction<string>) => {
      state.previousBody = state.body;
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
      for (const id of STAGE_ORDER) {
        if (id !== action.payload && state.stageStatus[id] === 'current') {
          state.stageStatus[id] = 'upcoming';
        }
      }
    },
    setCurrentStage: (state, action: PayloadAction<StageId>) => {
      for (const id of STAGE_ORDER) {
        if (state.stageStatus[id] === 'current') state.stageStatus[id] = 'upcoming';
      }
      if (state.stageStatus[action.payload] !== 'completed') {
        state.stageStatus[action.payload] = 'current';
      }
    },
    resetDraft: () => ({
      ...initialState,
      stageStatus: { ...initialStageStatus },
    }),
    hydrateDraft: (state, action: PayloadAction<Partial<EditorialDraftState>>) => {
      const incoming = action.payload;
      const stageStatus = { ...initialStageStatus, ...(incoming.stageStatus ?? {}) };
      for (const id of STAGE_ORDER) {
        if (stageStatus[id] === 'current') stageStatus[id] = 'upcoming';
        // Drop unknown old stage keys gracefully by only keeping known ids
        if (!(id in initialStageStatus)) delete (stageStatus as Record<string, StageStatus>)[id];
      }
      return {
        ...state,
        ...incoming,
        sourceUrl: incoming.sourceUrl ?? state.sourceUrl ?? '',
        originTitle:
          incoming.originTitle ||
          incoming.heading ||
          state.originTitle ||
          state.heading ||
          '',
        originUrl:
          incoming.originUrl ||
          incoming.sourceUrl ||
          state.originUrl ||
          state.sourceUrl ||
          '',
        startedAt: incoming.startedAt || state.startedAt || '',
        previousBody: incoming.previousBody ?? state.previousBody ?? '',
        liveCheck: incoming.liveCheck ?? state.liveCheck ?? null,
        advice: incoming.advice ?? state.advice ?? null,
        stageStatus,
      };
    },
  },
});

export const {
  setDraftHeading,
  setDraftBody,
  setSourceUrl,
  lockStartedFrom,
  setLiveCheck,
  setAdvice,
  applyRewrittenBody,
  setContentScore,
  setSemanticScore,
  markStageComplete,
  setCurrentStage,
  resetDraft,
  hydrateDraft,
} = editorialDraftSlice.actions;

export function loadPersistedDraft(): Partial<EditorialDraftState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem('llmagnet.editorialDraft.v8') ||
      window.localStorage.getItem('llmagnet.editorialDraft.v7') ||
      window.localStorage.getItem('llmagnet.editorialDraft.v6') ||
      window.localStorage.getItem('llmagnet.editorialDraft.v5') ||
      window.localStorage.getItem('llmagnet.editorialDraft.v4') ||
      window.localStorage.getItem('llmagnet.editorialDraft.v3');
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
    /* non-fatal */
  }
}

export function clearPersistedDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem('llmagnet.editorialDraft');
    window.localStorage.removeItem('llmagnet.editorialDraft.v2');
    window.localStorage.removeItem('llmagnet.editorialDraft.v3');
    window.localStorage.removeItem('llmagnet.editorialDraft.v4');
    window.localStorage.removeItem('llmagnet.editorialDraft.v5');
    window.localStorage.removeItem('llmagnet.editorialDraft.v6');
    window.localStorage.removeItem('llmagnet.editorialDraft.v7');
    window.localStorage.removeItem('llmagnet.editorialDraft.v8');
  } catch {
    /* non-fatal */
  }
}

export default editorialDraftSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success';
  icon: string;
}

interface ContentScoreState {
  headingText: string;
  inputText: string;
  score: number;
  suggestions: Suggestion[];
  overallSuggestions: string[];
  evaluated: boolean;
  isLoading: boolean;
  characterCount: number;
  headingCharacterCount: number;
}

const MAX_HEADING_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;

const initialState: ContentScoreState = {
  headingText: '',
  inputText: '',
  score: 0,
  suggestions: [
    {
      id: '1',
      title: 'Improve Title Clarity',
      description: 'Your title could be more descriptive and engaging.',
      type: 'warning',
      icon: '📝'
    },
    {
      id: '2',
      title: 'Enhance Content Structure',
      description: 'Add more headers to improve readability and SEO.',
      type: 'info',
      icon: '📋'
    },
    {
      id: '3',
      title: 'Optimize Keyword Usage',
      description: 'Your main keyword appears too infrequently.',
      type: 'warning',
      icon: '🔍'
    },
    {
      id: '4',
      title: 'Content Length',
      description: 'Aim for at least 1,500 words for better SEO.',
      type: 'info',
      icon: '📏'
    }
  ],
  overallSuggestions: [
    'Your content shows good potential but needs optimization in several key areas.',
    'Consider restructuring your content to better match search intent.',
    'Focus on expanding the main sections and incorporating more relevant keywords naturally.'
  ],
  evaluated: false,
  isLoading: false,
  characterCount: 0,
  headingCharacterCount: 0
};

const contentScoreSlice = createSlice({
  name: 'contentScore',
  initialState,
  reducers: {
    setHeadingText: (state, action: PayloadAction<string>) => {
      const text = action.payload.slice(0, MAX_HEADING_LENGTH);
      state.headingText = text;
      state.headingCharacterCount = text.length;
    },
    setInputText: (state, action: PayloadAction<string>) => {
      const text = action.payload.slice(0, MAX_CONTENT_LENGTH);
      state.inputText = text;
      state.characterCount = text.length;
    },
    clearHeading: (state) => {
      state.headingText = '';
      state.headingCharacterCount = 0;
    },
    clearInput: (state) => {
      state.inputText = '';
      state.characterCount = 0;
      state.evaluated = false;
    },
    evaluateContent: (state) => {
      state.isLoading = true;
      state.evaluated = false;
    },
    evaluationComplete: (state) => {
      state.isLoading = false;
      state.evaluated = true;
      // Mock score calculation based on heading and content
      const headingScore = Math.min(100, Math.floor((state.headingCharacterCount / MAX_HEADING_LENGTH) * 30));
      const contentScore = Math.min(100, Math.floor((state.characterCount / 1500) * 70));
      state.score = Math.floor((headingScore + contentScore) / 2);
    }
  }
});

export const {
  setHeadingText,
  setInputText,
  clearHeading,
  clearInput,
  evaluateContent,
  evaluationComplete
} = contentScoreSlice.actions;

export default contentScoreSlice.reducer; 
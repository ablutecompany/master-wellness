import { StateCreator } from 'zustand';
import { AppState, ThemeScore } from '../types';

export interface InsightsSlice {
  themeScores: ThemeScore[];
  globalScore: number;
  setThemeScores: (scores: ThemeScore[]) => void;
  setGlobalScore: (score: number) => void;
}

export const createInsightsSlice: StateCreator<AppState, [], [], InsightsSlice> = (set) => ({
  themeScores: [],
  globalScore: 0,
  setThemeScores: (themeScores) => set({ themeScores }),
  setGlobalScore: (score) => set({ globalScore: score }),
});

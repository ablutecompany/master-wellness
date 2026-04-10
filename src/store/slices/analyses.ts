import { StateCreator } from 'zustand';
import { AppState, Analysis } from '../types';

import { ProfileService } from '../../services/user/profileService';

export const createAnalysesSlice: StateCreator<AppState, [], [], Pick<AppState,
  'analyses' | 'activeAnalysisId' | 'addAnalysis' | 'removeAnalysis' | 'setActiveAnalysisId' | 'setAnalyses'
>> = (set, get) => ({
  analyses: [],
  activeAnalysisId: null,

  setAnalyses: (analyses: Analysis[]) => set({ analyses }),

  addAnalysis: (analysis: Analysis) => {
    set(state => ({
      analyses: [analysis, ...state.analyses.filter(a => a.id !== analysis.id)],
      // Quando uma análise é adicionada torna-se automaticamente a activa
      activeAnalysisId: analysis.id,
    }));
    
    // Persistir se for uma análise real (não demo)
    const state = get();
    if (analysis.source !== 'demo' && state.sessionToken) {
      ProfileService.updateActiveAnalysis(state.sessionToken, analysis.id);
    }
  },

  removeAnalysis: (id: string) => set(state => ({
    analyses: state.analyses.filter(a => a.id !== id),
    // Se a análise activa foi removida, limpa o pointer
    activeAnalysisId: state.activeAnalysisId === id
      ? (state.analyses.find(a => a.id !== id)?.id ?? null)
      : state.activeAnalysisId,
  })),

  setActiveAnalysisId: (id: string | null) => {
    set({ activeAnalysisId: id });
    
    const state = get();
    // Persistir apenas se a nova análise existir e não for demo
    const analysis = state.analyses.find(a => a.id === id);
    if (id && analysis?.source !== 'demo' && state.sessionToken) {
      ProfileService.updateActiveAnalysis(state.sessionToken, id);
    }
  },
});

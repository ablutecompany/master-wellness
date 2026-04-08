import { StateCreator } from 'zustand';
import { AppState, Analysis } from '../types';

export const createAnalysesSlice: StateCreator<AppState, [], [], Pick<AppState,
  'analyses' | 'activeAnalysisId' | 'addAnalysis' | 'removeAnalysis' | 'setActiveAnalysisId'
>> = (set) => ({
  analyses: [],
  activeAnalysisId: null,

  addAnalysis: (analysis: Analysis) => set(state => ({
    analyses: [analysis, ...state.analyses.filter(a => a.id !== analysis.id)],
    // Quando uma análise é adicionada torna-se automaticamente a activa
    activeAnalysisId: analysis.id,
  })),

  removeAnalysis: (id: string) => set(state => ({
    analyses: state.analyses.filter(a => a.id !== id),
    // Se a análise activa foi removida, limpa o pointer
    activeAnalysisId: state.activeAnalysisId === id
      ? (state.analyses.find(a => a.id !== id)?.id ?? null)
      : state.activeAnalysisId,
  })),

  setActiveAnalysisId: (id: string | null) => set({ activeAnalysisId: id }),
});

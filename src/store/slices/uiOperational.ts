import { StateCreator } from 'zustand';
import { AppState } from '../types';

export interface UiOperationalSlice {
  isNfcLoading: boolean;
  isMeasuring: boolean;
  isDemoMode: boolean;
  currentDemoPersonaIndex: number;
  hasHydrated: boolean;
  setNfcLoading: (loading: boolean) => void;
  setIsMeasuring: (measuring: boolean) => void;
  setIsDemoMode: (isDemoMode: boolean) => void;
  cycleDemoPersona: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const createUiOperationalSlice: StateCreator<AppState, [], [], UiOperationalSlice> = (set) => ({
  isNfcLoading: false,
  isMeasuring: false,
  isDemoMode: false,
  currentDemoPersonaIndex: 0,
  hasHydrated: false,
  setNfcLoading: (isNfcLoading) => set({ isNfcLoading }),
  setIsMeasuring: (isMeasuring) => set({ isMeasuring }),
  setIsDemoMode: (isDemoMode) => set(state => ({ 
    isDemoMode, 
    currentDemoPersonaIndex: isDemoMode ? state.currentDemoPersonaIndex : 0 
  })),
  cycleDemoPersona: () => set(state => ({
    currentDemoPersonaIndex: state.currentDemoPersonaIndex + 1
  })),
  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
});

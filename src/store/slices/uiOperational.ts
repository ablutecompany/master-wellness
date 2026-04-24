import { StateCreator } from 'zustand';
import { AppState } from '../types';

export interface UiOperationalSlice {
  isNfcLoading: boolean;
  isMeasuring: boolean;
  isDemoMode: boolean;
  hasHydrated: boolean;
  setNfcLoading: (loading: boolean) => void;
  setIsMeasuring: (measuring: boolean) => void;
  setIsDemoMode: (isDemoMode: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const createUiOperationalSlice: StateCreator<AppState, [], [], UiOperationalSlice> = (set) => ({
  isNfcLoading: false,
  isMeasuring: false,
  isDemoMode: false,
  hasHydrated: false,
  setNfcLoading: (isNfcLoading) => set({ isNfcLoading }),
  setIsMeasuring: (isMeasuring) => set({ isMeasuring }),
  setIsDemoMode: (isDemoMode) => set({ isDemoMode }),
  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
});

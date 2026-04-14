import { StateCreator } from 'zustand';
import { AppState } from '../types';

export interface UiOperationalSlice {
  isNfcLoading: boolean;
  isMeasuring: boolean;
  hasHydrated: boolean;
  setNfcLoading: (loading: boolean) => void;
  setIsMeasuring: (measuring: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const createUiOperationalSlice: StateCreator<AppState, [], [], UiOperationalSlice> = (set) => ({
  isNfcLoading: false,
  isMeasuring: false,
  hasHydrated: false,
  setNfcLoading: (isNfcLoading) => set({ isNfcLoading }),
  setIsMeasuring: (isMeasuring) => set({ isMeasuring }),
  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
});

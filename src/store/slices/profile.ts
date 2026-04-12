import { StateCreator } from 'zustand';
import { AppState, UserProfile } from '../types';

export interface ProfileSlice {
  user: UserProfile | null;
  guestProfile: UserProfile | null;
  isGuestMode: boolean;
  credits: number;
  sessionToken: string | null;
  setUser: (user: UserProfile | null) => void;
  setGuestMode: (isGuest: boolean) => void;
  updateGuestProfile: (profile: Partial<UserProfile>) => void;
  setCredits: (credits: number) => void;
  setSessionToken: (token: string | null) => void;
  clearSensitiveState: () => void;
}

export const createProfileSlice: StateCreator<AppState, [], [], ProfileSlice> = (set) => ({
  user: null,
  guestProfile: {
    name: 'Convidada',
    goals: [],
  },
  isGuestMode: false,
  credits: 10,
  sessionToken: null,
  setUser: (user) => set({ user }),
  setGuestMode: (isGuestMode) => set({ isGuestMode }),
  updateGuestProfile: (updates) => set((state) => ({ 
    guestProfile: state.guestProfile ? { ...state.guestProfile, ...updates } : { name: 'Convidada', goals: [], ...updates }
  })),
  setCredits: (credits) => set({ credits }),
  setSessionToken: (token) => set({ sessionToken: token }),
  clearSensitiveState: () => set({
    measurements: [],
    analyses: [],
    activeAnalysisId: null,
    appContributionEvents: [],
  }),
});

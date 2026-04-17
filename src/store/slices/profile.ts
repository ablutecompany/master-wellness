import { StateCreator } from 'zustand';
import { AppState, UserProfile } from '../state-types';

export interface ProfileSlice {
  user: UserProfile | null;
  authAccount: any | null;
  profileStatus: ProfileStatus;
  guestProfile: UserProfile | null;
  isGuestMode: boolean;
  credits: number;
  sessionToken: string | null;
  setUser: (user: UserProfile | null) => void;
  setAuthAccount: (account: any | null) => void;
  setProfileStatus: (status: ProfileStatus) => void;
  setGuestMode: (isGuest: boolean) => void;
  updateGuestProfile: (profile: Partial<UserProfile>) => void;
  setCredits: (credits: number) => void;
  setSessionToken: (token: string | null) => void;
  clearSensitiveState: () => void;
}

export const createProfileSlice: StateCreator<AppState, [], [], ProfileSlice> = (set) => ({
  user: null,
  authAccount: null,
  profileStatus: 'idle',
  guestProfile: {
    name: 'Convidada',
    goals: [],
  },
  isGuestMode: false,
  credits: 10,
  sessionToken: null,
  setUser: (user) => set({ user }),
  setAuthAccount: (authAccount) => set({ authAccount }),
  setProfileStatus: (profileStatus) => set({ profileStatus }),
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

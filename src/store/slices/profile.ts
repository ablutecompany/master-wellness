import { StateCreator } from 'zustand';
import { AppState, UserProfile } from '../state-types';
import { ProfileService } from '../../services/user/profileService';
import { ENV } from '../../config/env';

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
  updateAuthenticatedProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  setCredits: (credits: number) => void;
  setSessionToken: (token: string | null) => void;
  clearSensitiveState: () => void;
}

export const createProfileSlice: StateCreator<AppState, [], [], ProfileSlice> = (set, get) => ({
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
  updateAuthenticatedProfile: async (updates) => {
    const { sessionToken, user } = get();
    if (!sessionToken) return false;
    
    // 1. Gravação no Backend
    const success = await ProfileService.updateProfile(sessionToken, updates);
    if (!success) return false;
    
    // 2. Refetch canónico direto do backend para a store
    try {
      const response = await fetch(`${ENV.BACKEND_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.profile) {
          set({ user: data.profile });
          return true;
        }
      }
    } catch(e) {
      console.warn("Failed to refetch auth/me after patch", e);
    }
    
    // 3. Fallback Optimista caso falhe a rehidratação imediata
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : { name: 'Utilizador', goals: [], ...updates }
    }));
    return true;
  },
  setCredits: (credits) => set({ credits }),
  setSessionToken: (token) => set({ sessionToken: token }),
  clearSensitiveState: () => set({
    measurements: [],
    analyses: [],
    activeAnalysisId: null,
    appContributionEvents: [],
  }),
});

import { StateCreator } from 'zustand';
import { AppState, UserProfile } from '../state-types';
import { ProfileService } from '../../services/user/profileService';
import { supabase } from '../../services/supabase';
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
    let { sessionToken, user } = get();
    
    // Dynamic token fetch if missing in global state
    if (!sessionToken) {
      const { data } = await supabase.auth.getSession();
      sessionToken = data?.session?.access_token || null;
      if (sessionToken) {
        set({ sessionToken });
      }
    }

    if (!sessionToken) {
      console.warn('[ProfileSlice] Aborting save: No auth token active.');
      return false;
    }
    
    // Optimista
    const previousUser = user;
    set((state) => {
      const nextUser = state.user ? { ...state.user, ...updates } : { name: 'Utilizador', goals: [], ...updates };
      return { user: nextUser };
    });
    
    // 1. Gravação no Backend // Retorna a versão canónica!
    const result = await ProfileService.updateProfile(sessionToken, updates);
    if (!result.ok || !result.profile) {
      // Rollback
      set({ user: previousUser });
      return false;
    }
    
    // 2. Reflete resposta consolidada devolvida
    console.warn(`[DEV NAME 5] store user after save:`, JSON.stringify(result.profile));
    set({ user: result.profile });
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

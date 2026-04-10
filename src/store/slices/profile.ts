import { StateCreator } from 'zustand';
import { AppState, UserProfile } from '../types';

export interface ProfileSlice {
  user: UserProfile | null;
  credits: number;
  sessionToken: string | null;
  setUser: (user: UserProfile | null) => void;
  setCredits: (credits: number) => void;
  setSessionToken: (token: string | null) => void;
}

export const createProfileSlice: StateCreator<AppState, [], [], ProfileSlice> = (set) => ({
  user: null,
  credits: 10,
  sessionToken: null,
  setUser: (user) => set({ user }),
  setCredits: (credits) => set({ credits }),
  setSessionToken: (token) => set({ sessionToken: token }),
});

import { StateCreator } from 'zustand';
import { AppState, UserProfile } from '../types';

export interface ProfileSlice {
  user: UserProfile | null;
  credits: number;
  setUser: (user: UserProfile) => void;
  setCredits: (credits: number) => void;
}

export const createProfileSlice: StateCreator<AppState, [], [], ProfileSlice> = (set) => ({
  user: null,
  credits: 10,
  setUser: (user) => set({ user }),
  setCredits: (credits) => set({ credits }),
});

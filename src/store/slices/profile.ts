import { StateCreator } from 'zustand';
import { AppState, UserProfile, ProfileStatus } from '../state-types';
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
  household: any | null;
  activeMemberId: string | null;
  exportedContexts: any[];
  setUser: (user: UserProfile | null) => void;
  setAuthAccount: (account: any | null) => void;
  setProfileStatus: (status: ProfileStatus) => void;
  setGuestMode: (isGuest: boolean) => void;
  updateGuestProfile: (profile: Partial<UserProfile>) => void;
  updateAuthenticatedProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  setCredits: (credits: number) => void;
  setSessionToken: (token: string | null) => void;
  clearSensitiveState: () => void;
  setExportedContext: (context: any) => void;
  clearExportedContext: (contextId: string) => void;
  setHousehold: (household: any) => void;
  setActiveMember: (memberId: string | null) => void;
  addHouseholdMember: (member: any) => Promise<boolean>;
  updateHouseholdMember: (memberId: string, updates: Partial<UserProfile>) => Promise<boolean>;
  updateHouseholdMemberPermissions: (memberId: string, permissions: any) => Promise<boolean>;
  inviteHouseholdMember: (memberId: string, email: string) => Promise<boolean>;
  acceptHouseholdInvite: (inviteId: string) => Promise<boolean>;
  cancelHouseholdInvite: (inviteId: string) => Promise<boolean>;
  removeHouseholdMember: (memberId: string) => Promise<boolean>;
  disconnectHouseholdMember: (memberId: string) => Promise<boolean>;
}

export const createProfileSlice: StateCreator<AppState, [], [], ProfileSlice> = (set, get) => ({
  user: null,
  authAccount: null,
  profileStatus: 'idle',
  household: null,
  activeMemberId: null,
  guestProfile: {
    id: 'guest',
    name: 'Convidada',
  },
  isGuestMode: false,
  credits: 10,
  sessionToken: null,
  exportedContexts: [],
  measurements: [],
  setUser: (user) => set({ user }),
  setAuthAccount: (authAccount) => set({ authAccount }),
  setProfileStatus: (profileStatus) => set({ profileStatus }),
  setGuestMode: (isGuestMode) => set({ isGuestMode }),
  updateGuestProfile: (updates) => set((state) => ({ 
    guestProfile: state.guestProfile ? { ...state.guestProfile, ...updates } : { id: 'guest_stub', name: 'Convidada', ...updates }
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
      const nextUser = state.user ? { ...state.user, ...updates } : { id: 'auth_stub', name: 'Utilizador', ...updates };
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
    guestProfile: { id: 'guest', name: 'Convidada' },
    exportedContexts: [],
  }),
  setExportedContext: (context) => set((state) => {
    const existingIdx = state.exportedContexts.findIndex(c => c.id === context.id);
    if (existingIdx !== -1) {
      const newContexts = [...state.exportedContexts];
      newContexts[existingIdx] = context;
      return { exportedContexts: newContexts };
    }
    return { exportedContexts: [...state.exportedContexts, context] };
  }),
  clearExportedContext: (contextId) => set((state) => ({
    exportedContexts: state.exportedContexts.filter(c => c.id !== contextId)
  })),
  setHousehold: (household) => set({ household }),
  setActiveMember: (memberId) => set({ activeMemberId: memberId }),
  addHouseholdMember: async (member) => {
    let newHousehold = null;
    set((state) => {
      if (!state.household) return state;
      newHousehold = {
        ...state.household,
        members: [...state.household.members, member]
      };
      return { household: newHousehold };
    });

    const token = get().sessionToken;
    if (token && newHousehold) {
      try {
        const { ProfileService } = await import('../../services/user/profileService');
        const res = await ProfileService.patchHousehold(token, newHousehold);
        if (!res.ok) throw new Error('Failed');
        return true;
      } catch (err) {
        alert('Erro ao guardar o novo membro. A reverter.');
        // naive revert
        const prevHh = get().household;
        if (prevHh) set({ household: { ...prevHh, members: prevHh.members.filter((m: any) => m.id !== member.id) } });
        return false;
      }
    }
    return true; // guest mode optimistic
  },
  updateHouseholdMember: async (memberId, updates) => {
    let newHousehold = null;
    let originalHousehold = get().household;
    
    set((state) => {
      if (!state.household) return state;
      const updatedMembers = state.household.members.map(m => {
        if (m.id === memberId) {
          return { ...m, profile: { ...m.profile, ...updates } };
        }
        return m;
      });
      newHousehold = { ...state.household, members: updatedMembers };
      return { household: newHousehold };
    });

    const token = get().sessionToken;
    if (token && newHousehold) {
       try {
         const { ProfileService } = await import('../../services/user/profileService');
         const res = await ProfileService.patchHousehold(token, newHousehold);
         if (!res.ok) throw new Error('API failed to persist');
         return true;
       } catch (err) {
         alert('Erro ao atualizar o membro do agregado. A reverter versão offline.');
         set({ household: originalHousehold });
         return false;
       }
    }
    return true;
  },
  updateHouseholdMemberPermissions: async (memberId, permissions) => {
    let newHousehold = null;
    let originalHousehold = get().household;
    
    set((state) => {
      if (!state.household) return state;
      const updatedMembers = state.household.members.map(m => {
        if (m.id === memberId) {
          return { ...m, permissions: { ...(m.permissions || {}), ...permissions } };
        }
        return m;
      });
      newHousehold = { ...state.household, members: updatedMembers };
      return { household: newHousehold };
    });

    const token = get().sessionToken;
    if (token && newHousehold) {
       try {
         const { ProfileService } = await import('../../services/user/profileService');
         const res = await ProfileService.patchHousehold(token, newHousehold);
         if (!res.ok) throw new Error('API failed to persist permissions');
         return true;
       } catch (err) {
         alert('Erro ao atualizar permissões. A reverter versão offline.');
         set({ household: originalHousehold });
         return false;
       }
    }
    return true;
  },
  inviteHouseholdMember: async (memberId, email) => {
    const token = get().sessionToken;
    if (!token) return false;
    try {
      const { ProfileService } = await import('../../services/user/profileService');
      const res = await ProfileService.createInvite(token, memberId, email);
      if (res.ok && res.household) {
        set({ household: res.household });
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
  acceptHouseholdInvite: async (inviteId) => {
    const token = get().sessionToken;
    if (!token) return false;
    try {
      const { ProfileService } = await import('../../services/user/profileService');
      const res = await ProfileService.acceptInvite(token, inviteId);
      if (res.ok && res.household) {
        set({ household: res.household, activeMemberId: null });
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
  cancelHouseholdInvite: async (inviteId) => {
    let newHousehold = null;
    let originalHousehold = get().household;
    
    set((state) => {
      if (!state.household) return state;
      newHousehold = { 
        ...state.household, 
        invitations: state.household.invitations?.filter((i: any) => i.id !== inviteId) || []
      };
      return { household: newHousehold };
    });

    const token = get().sessionToken;
    if (token && newHousehold) {
       try {
         const { ProfileService } = await import('../../services/user/profileService');
         const res = await ProfileService.patchHousehold(token, newHousehold);
         if (!res.ok) throw new Error('API failed to persist cancel');
         return true;
       } catch (err) {
         set({ household: originalHousehold });
         return false;
       }
    }
    return true;
  },
  removeHouseholdMember: async (memberId) => {
    let newHousehold = null;
    let originalHousehold = get().household;
    let originalActive = get().activeMemberId;
    
    set((state) => {
      if (!state.household) return state;
      newHousehold = { 
        ...state.household, 
        members: state.household.members.filter(m => m.id !== memberId),
        invitations: state.household.invitations?.filter((i: any) => i.memberId !== memberId) || []
      };
      // Protect active member state
      const nextActive = state.activeMemberId === memberId ? null : state.activeMemberId;
      return { household: newHousehold, activeMemberId: nextActive };
    });

    const token = get().sessionToken;
    if (token && newHousehold) {
       try {
         const { ProfileService } = await import('../../services/user/profileService');
         const res = await ProfileService.patchHousehold(token, newHousehold);
         if (!res.ok) throw new Error('API failed to persist deletion');
         return true;
       } catch (err) {
         set({ household: originalHousehold, activeMemberId: originalActive });
         return false;
       }
    }
    return true;
  },
  disconnectHouseholdMember: async (memberId) => {
    let newHousehold = null;
    let originalHousehold = get().household;
    
    set((state) => {
      if (!state.household) return state;
      const updatedMembers = state.household.members.map(m => {
        if (m.id === memberId) {
          const mCopy = { ...m };
          delete mCopy.userId; // disconnect
          return mCopy;
        }
        return m;
      });
      newHousehold = { ...state.household, members: updatedMembers };
      return { household: newHousehold };
    });

    const token = get().sessionToken;
    if (token && newHousehold) {
       try {
         const { ProfileService } = await import('../../services/user/profileService');
         const res = await ProfileService.patchHousehold(token, newHousehold);
         if (!res.ok) throw new Error('API failed to persist disconnect');
         return true;
       } catch (err) {
         set({ household: originalHousehold });
         return false;
       }
    }
    return true;
  },
});

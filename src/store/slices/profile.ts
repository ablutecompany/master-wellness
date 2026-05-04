import { StateCreator } from 'zustand';
import { AppState, UserProfile, ProfileStatus, HouseholdMember } from '../state-types';
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

export const normalizeProfile = (rawProfile: any): UserProfile | null => {
  if (!rawProfile || typeof rawProfile !== 'object') return null;
  if (!rawProfile.id) {
    console.error('[P0_PROFILE_NORMALIZE] Missing mandatory id in rawProfile');
    return null;
  }

  const invalidFields: string[] = [];
  const normalized: any = { ...rawProfile };

  // A backend agora envia o avatarUrl na raiz
  if (!normalized.avatarUrl && rawProfile.avatar_url) {
    normalized.avatarUrl = rawProfile.avatar_url; // just in case legacy snake case appears
  }
  
  console.log('[P0_AVATAR_ACCOUNT_SWITCH] normalizeProfile', {
    userId: normalized.id,
    hasAvatar: !!normalized.avatarUrl,
    avatarLength: normalized.avatarUrl?.length || 0
  });

  if (typeof normalized.name !== 'string') {
    normalized.name = normalized.email ? normalized.email.split('@')[0] : 'Utilizador';
    invalidFields.push('name');
  }

  if (normalized.dateOfBirth) {
    const d = new Date(normalized.dateOfBirth);
    if (isNaN(d.getTime())) {
      invalidFields.push('dateOfBirth');
      delete normalized.dateOfBirth;
      delete normalized.dateOfBirthPrecision;
    }
  }

  if (normalized.height !== undefined && normalized.height !== null) {
    const h = Number(normalized.height);
    if (isNaN(h) || h <= 0) {
      invalidFields.push('height');
      delete normalized.height;
    } else {
      normalized.height = h;
    }
  }

  if (normalized.weight !== undefined && normalized.weight !== null && typeof normalized.weight === 'object') {
    if (normalized.weight.value !== undefined && normalized.weight.value !== null) {
      const w = Number(normalized.weight.value);
      if (isNaN(w) || w <= 0) {
        invalidFields.push('weight.value');
      } else {
        normalized.weight.value = w;
      }
    }
  }

  if (invalidFields.length > 0) {
    console.warn('[P0_PROFILE_NORMALIZE] Normalized invalid fields:', {
      inputKeys: Object.keys(rawProfile),
      invalidFields,
      outputKeys: Object.keys(normalized)
    });
  }

  return normalized as UserProfile;
};

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
  setUser: (user) => {
    set((state) => {
      let nextActiveMemberId = state.activeMemberId;
      if (!nextActiveMemberId && user) {
        nextActiveMemberId = user.id;
      } else if (nextActiveMemberId && !user) {
        nextActiveMemberId = null;
      }
      return { user, activeMemberId: nextActiveMemberId };
    });
  },
  setAuthAccount: (authAccount) => set({ authAccount }),
  setProfileStatus: (profileStatus) => set({ profileStatus }),
  setGuestMode: (isGuestMode) => set({ isGuestMode }),
  updateGuestProfile: (updates) => set((state) => ({ 
    guestProfile: state.guestProfile ? { ...state.guestProfile, ...updates } : { id: 'guest_stub', name: 'Convidada', ...updates }
  })),
  updateAuthenticatedProfile: async (updates) => {
    let { sessionToken, user } = get();
    
    console.log('[P0_AVATAR_SAVE] trigger updateAuthenticatedProfile', {
      userId: user?.id,
      hasAvatarUpdate: updates.avatarUrl !== undefined,
      avatarUrlLengthSent: updates.avatarUrl ? updates.avatarUrl.length : 0,
      isExplicitRemoval: updates.avatarUrl === null
    });

    if (updates.avatarUrl === null && !(updates as any)._explicitAvatarRemoval) {
      console.warn('[P0_AVATAR_SAVE] Blocked implicit avatar removal');
      delete updates.avatarUrl;
    }

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
    
    console.log('[P0_PROFILE_SAVE] fieldsReceived:', updates);

    // Optimista
    const previousUser = user;
    const nextUser = previousUser ? { ...previousUser, ...updates } : { id: 'auth_stub', name: 'Utilizador', ...updates };
    set({ user: nextUser });
    
    // 1. Gravação no Backend
    try {
      const result = await ProfileService.updateProfile(sessionToken, updates);
      
      console.log('[P0_AVATAR_SAVE] updateProfile response', {
        ok: result.ok,
        hasProfile: !!result.profile
      });
      console.log('[P0_PROFILE_PATCH]', {
        userId: user?.id,
        fieldsReceived: updates,
        readBackSuccess: result.ok && !!result.profile,
        returnedFields: result.profile ? Object.keys(result.profile) : []
      });

      if (!result.ok || !result.profile) {
        console.error('[ProfileSlice] Backend update failed. Reverting optimistic state, but keeping avatar if it was just changed.');
        const rollbackUser = previousUser ? { ...previousUser } : { id: 'auth_stub', name: 'Utilizador', ...updates } as any;
        // Se a falha foi payload too large ou network, manter o preview do avatar local para o utilizador poder tentar novamente ou pelo menos não ver o fallback
        if (updates.avatarUrl !== undefined) {
           rollbackUser.avatarUrl = updates.avatarUrl;
        }
        set({ user: rollbackUser as UserProfile });
        return false;
      }
      
      // Validação extra
      const normalizedResponse = normalizeProfile(result.profile);
      if (!normalizedResponse) {
        console.error('[ProfileSlice] Backend returned incomplete profile. Reverting optimistic state.');
        set({ user: previousUser });
        return false;
      }

      // Merge seguro: se o backend devolveu sucesso mas sem campos essenciais, e tínhamos, preservar. 
      // (Só removemos se o utilizador enviou explicitamente null)
      if (!normalizedResponse.avatarUrl && nextUser.avatarUrl && updates.avatarUrl !== null) {
         normalizedResponse.avatarUrl = nextUser.avatarUrl;
      }
      if (normalizedResponse.name === 'Utilizador' && previousUser?.name && previousUser.name !== 'Utilizador' && updates.name !== null) {
         normalizedResponse.name = previousUser.name;
      }
      if (!normalizedResponse.dateOfBirth && previousUser?.dateOfBirth && updates.dateOfBirth !== null) {
         normalizedResponse.dateOfBirth = previousUser.dateOfBirth;
      }
      if (!normalizedResponse.sex && previousUser?.sex && updates.sex !== null) {
         normalizedResponse.sex = previousUser.sex;
      }

      // 2. Reflete resposta consolidada devolvida
      set({ user: normalizedResponse });
      return true;
    } catch (err) {
      console.error('[ProfileSlice] Exception during updateAuthenticatedProfile:', err);
      const rollbackUser = previousUser ? { ...previousUser } : { id: 'auth_stub', name: 'Utilizador', ...updates } as any;
      if (updates.avatarUrl !== undefined) {
         rollbackUser.avatarUrl = updates.avatarUrl;
      }
      set({ user: rollbackUser as UserProfile }); 
      return false;
    }
  },
  setCredits: (credits) => set({ credits }),
  setSessionToken: (token) => set({ sessionToken: token }),
  clearSensitiveState: () => {
    console.log('[P0_AVATAR_ACCOUNT_SWITCH] clearSensitiveState triggered (Logout)');
    set({
      measurements: [],
      analyses: [],
      activeAnalysisId: null,
      appContributionEvents: [],
      guestProfile: { id: 'guest', name: 'Convidada' },
      exportedContexts: [],
      user: null,
      authAccount: null,
      profileStatus: 'idle',
      household: null,
      activeMemberId: null,
      sessionToken: null,
      isGuestMode: false
    });
  },
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
  setActiveMember: (memberId) => {
    set((state) => {
      console.log('[P0_ACTIVE_MEMBER_SET]', { previousActiveMemberId: state.activeMemberId, nextActiveMemberId: memberId });
      return { activeMemberId: memberId };
    });
  },
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
          return { 
            ...m, 
            ...updates,
            name: updates.name ?? m.name
          } as HouseholdMember;
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

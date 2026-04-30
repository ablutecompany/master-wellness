import { StateCreator } from 'zustand';
import { AppState } from '../types';
import { Permission } from '../../miniapps/types';
import { saveToStorage, loadFromStorage } from '../persistence';

export interface PermissionsSlice {
  grantedPermissions: Record<string, Permission[]>;
  grantPermissions: (appId: string, perms: Permission[]) => void;
  hasGrantedPermissions: (id: string) => boolean;
}

export const createPermissionsSlice: StateCreator<AppState, [], [], PermissionsSlice> = (set, get) => {
  const persisted = loadFromStorage();
  
  return {
    grantedPermissions: persisted.grantedPermissions,

    grantPermissions: (appId, perms) =>
      set((state) => {
        const next = { ...state.grantedPermissions, [appId]: perms };
        saveToStorage(
        state.installedAppIds, 
        state.favoriteAppIds,
        next, 
        state.appEvents, 
        state.appContributionEvents
      );  return { grantedPermissions: next };
      }),

    hasGrantedPermissions: (id) => !!get().grantedPermissions[id],
  };
};

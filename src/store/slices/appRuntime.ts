import { StateCreator } from 'zustand';
import { AppState } from '../types';
import { MiniAppManifest, MiniAppEvent } from '../../miniapps/types';
import { saveToStorage, loadFromStorage } from '../persistence';

const persisted = loadFromStorage();

export interface AppRuntimeSlice {
  installedAppIds: string[];
  activeApp: MiniAppManifest | null;
  appEvents: MiniAppEvent[];
  installApp: (id: string) => void;
  uninstallApp: (id: string) => void;
  launchApp: (app: MiniAppManifest) => void;
  closeApp: () => void;
  recordAppEvent: (event: MiniAppEvent) => void;
  isAppInstalled: (id: string) => boolean;
}

export const createAppRuntimeSlice: StateCreator<AppState, [], [], AppRuntimeSlice> = (set, get) => ({
  installedAppIds: persisted.installedAppIds,
  activeApp: null,
  appEvents: persisted.appEvents,

  installApp: (id) =>
    set((state) => {
      const next = state.installedAppIds.includes(id)
        ? state.installedAppIds
        : [...state.installedAppIds, id];
      saveToStorage(next, state.grantedPermissions, state.appEvents, state.appContributionEvents);
      return { installedAppIds: next };
    }),

  uninstallApp: (id) =>
    set((state) => {
      const next = state.installedAppIds.filter((a) => a !== id);
      const perms = Object.fromEntries(
        Object.entries(state.grantedPermissions).filter(([k]) => k !== id)
      );
      saveToStorage(next, perms, state.appEvents, state.appContributionEvents);
      return { installedAppIds: next, grantedPermissions: perms };
    }),

  launchApp: (app) => set({ activeApp: app }),
  closeApp: () => set({ activeApp: null }),

  recordAppEvent: (event) => set((state) => {
    const nextEvents = [event, ...state.appEvents];
    saveToStorage(state.installedAppIds, state.grantedPermissions, nextEvents, state.appContributionEvents);
    return { appEvents: nextEvents };
  }),

  isAppInstalled: (id) => get().installedAppIds.includes(id),
});

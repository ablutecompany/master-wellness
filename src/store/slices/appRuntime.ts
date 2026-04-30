import { StateCreator } from 'zustand';
import { AppState } from '../types';
import { MiniAppManifest, MiniAppEvent } from '../../miniapps/types';
import { saveToStorage, loadFromStorage } from '../persistence';

const persisted = loadFromStorage();

export interface AppRuntimeSlice {
  installedAppIds: string[];
  favoriteAppIds: string[];
  activeApp: MiniAppManifest | null;
  appEvents: MiniAppEvent[];
  installApp: (id: string) => void;
  uninstallApp: (id: string) => void;
  toggleFavoriteApp: (id: string) => void;
  launchApp: (app: MiniAppManifest) => void;
  closeApp: () => void;
  recordAppEvent: (event: MiniAppEvent) => void;
  isAppInstalled: (id: string) => boolean;
  isAppFavorite: (id: string) => boolean;
}

export const createAppRuntimeSlice: StateCreator<AppState, [], [], AppRuntimeSlice> = (set, get) => ({
  installedAppIds: persisted.installedAppIds || [],
  favoriteAppIds: persisted.favoriteAppIds || [],
  activeApp: null,
  appEvents: persisted.appEvents || [],

  installApp: (id) =>
    set((state) => {
      const next = state.installedAppIds.includes(id)
        ? state.installedAppIds
        : [...state.installedAppIds, id];
      saveToStorage(next, state.favoriteAppIds, state.grantedPermissions, state.appEvents, state.appContributionEvents);
      return { installedAppIds: next };
    }),

  uninstallApp: (id) =>
    set((state) => {
      const nextInstalled = state.installedAppIds.filter((a) => a !== id);
      const nextFavorites = state.favoriteAppIds.filter((a) => a !== id);
      const perms = Object.fromEntries(
        Object.entries(state.grantedPermissions).filter(([k]) => k !== id)
      );
      saveToStorage(nextInstalled, nextFavorites, perms, state.appEvents, state.appContributionEvents);
      return { installedAppIds: nextInstalled, favoriteAppIds: nextFavorites, grantedPermissions: perms };
    }),

  toggleFavoriteApp: (id) =>
    set((state) => {
      const isFav = state.favoriteAppIds.includes(id);
      let nextFavorites = [...state.favoriteAppIds];
      
      if (isFav) {
        nextFavorites = nextFavorites.filter(f => f !== id);
      } else {
        if (nextFavorites.length < 5) {
          nextFavorites.push(id);
        } else {
          // Limit reached, we do not add and return same state
          if (typeof window !== 'undefined' && window.alert) {
            window.alert('Limite de favoritos atingido. Remove uma app dos favoritos para adicionar outra.');
          }
          return state;
        }
      }
      
      saveToStorage(state.installedAppIds, nextFavorites, state.grantedPermissions, state.appEvents, state.appContributionEvents);
      return { favoriteAppIds: nextFavorites };
    }),

  launchApp: (app) => set({ activeApp: app }),
  closeApp: () => set({ activeApp: null }),

  recordAppEvent: (event) => set((state) => {
    const nextEvents = [event, ...state.appEvents];
    saveToStorage(state.installedAppIds, state.favoriteAppIds, state.grantedPermissions, nextEvents, state.appContributionEvents);
    return { appEvents: nextEvents };
  }),

  isAppInstalled: (id) => get().installedAppIds.includes(id),
  isAppFavorite: (id) => get().favoriteAppIds.includes(id),
});

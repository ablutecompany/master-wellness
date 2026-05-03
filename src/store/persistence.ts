import { Platform } from 'react-native';
import { Permission, MiniAppEvent, AppContributionEvent } from '../miniapps/types';

const STORAGE_KEY = 'ablute-app-store';

export function loadFromStorage(): { 
  installedAppIds: string[]; 
  favoriteAppIds: string[];
  grantedPermissions: Record<string, Permission[]>; 
  appEvents: MiniAppEvent[];
  appContributionEvents: AppContributionEvent[];
} {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { 
          installedAppIds: Array.isArray(parsed.installedAppIds) ? parsed.installedAppIds : [],
          favoriteAppIds: Array.isArray(parsed.favoriteAppIds) ? parsed.favoriteAppIds : [],
          grantedPermissions: parsed.grantedPermissions || {},
          appEvents: Array.isArray(parsed.appEvents) ? parsed.appEvents : [],
          appContributionEvents: Array.isArray(parsed.appContributionEvents) ? parsed.appContributionEvents : []
        };
      }
    }
  } catch {}
  return { installedAppIds: [], favoriteAppIds: [], grantedPermissions: {}, appEvents: [], appContributionEvents: [] };
}

export function saveToStorage(
  installedAppIds: string[], 
  favoriteAppIds: string[],
  grantedPermissions: Record<string, Permission[]>, 
  appEvents: MiniAppEvent[],
  appContributionEvents: AppContributionEvent[]
) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        installedAppIds, 
        favoriteAppIds,
        grantedPermissions, 
        appEvents,
        appContributionEvents 
      }));
    }
  } catch {}
}

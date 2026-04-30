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
      if (raw) return { appEvents: [], appContributionEvents: [], ...JSON.parse(raw) };
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

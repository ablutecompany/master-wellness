import { StateCreator } from 'zustand';
import { AppState } from '../types';
import { AppContributionEvent } from '../../miniapps/types';
import { saveToStorage, loadFromStorage } from '../persistence';

export interface ContributionsSlice {
  appContributionEvents: AppContributionEvent[];
  addAppContributionEvent: (event: AppContributionEvent) => void;
}

export const createContributionsSlice: StateCreator<AppState, [], [], ContributionsSlice> = (set, get) => {
  const persisted = loadFromStorage();

  return {
    appContributionEvents: persisted.appContributionEvents,

    addAppContributionEvent: (event) => set((state) => {
      // Deduplicação determinística
      const isDuplicate = state.appContributionEvents.some(e => 
        e.eventId === event.eventId || 
        (e.sourceAppId === event.sourceAppId && 
         e.eventType === event.eventType && 
         Math.abs(e.recordedAt - event.recordedAt) < 1000 && 
         JSON.stringify(e.payload) === JSON.stringify(event.payload))
      );

      if (isDuplicate) {
        console.log('[Store] Evento duplicado ignorado:', event.eventType, event.eventId);
        return state;
      }

      const nextEvents = [event, ...state.appContributionEvents];
      saveToStorage(state.installedAppIds, state.grantedPermissions, state.appEvents, nextEvents);
      
      // Governed Invalidation v1.2.0: Resolução por Afinidade Determinística
      const userId = 'user_current_session_1';
      
      import('../../services/semantic-output')
        .then(({ semanticOutputService }) => {
          semanticOutputService.markDirtyFromContribution(userId, event.sourceAppId, event.eventType);
        })
        .catch((err) => console.warn('[StrictCycleGuard] falha ao carregar semanticOutputService em contributions:', err));
      
      return { appContributionEvents: nextEvents };
    }),
  };
};

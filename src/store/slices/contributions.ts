import { StateCreator } from 'zustand';
import { AppState } from '../types';
import { AppContributionEvent } from '../../miniapps/types';
import { saveToStorage, loadFromStorage } from '../persistence';

const persisted = loadFromStorage();

export interface ContributionsSlice {
  appContributionEvents: AppContributionEvent[];
  addAppContributionEvent: (event: AppContributionEvent) => void;
}

export const createContributionsSlice: StateCreator<AppState, [], [], ContributionsSlice> = (set) => ({
  appContributionEvents: persisted.appContributionEvents,

  addAppContributionEvent: (event) => set((state) => {
    // Deduplicação determinística
    const isDuplicate = state.appContributionEvents.some(e => 
      e.eventId === event.eventId || 
      (e.sourceAppId === event.sourceAppId && 
       e.eventType === event.eventType && 
       Math.abs(e.recordedAt - event.recordedAt) < 1000 && // Janela de 1s para o mesmo timestamp real
       JSON.stringify(e.payload) === JSON.stringify(event.payload))
    );

    if (isDuplicate) {
      console.log('[Store] Evento duplicado ignorado:', event.eventType, event.eventId);
      return state;
    }

    const nextEvents = [event, ...state.appContributionEvents];
    saveToStorage(state.installedAppIds, state.grantedPermissions, state.appEvents, nextEvents);
    return { appContributionEvents: nextEvents };
  }),
});

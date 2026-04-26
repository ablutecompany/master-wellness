import { StateCreator } from 'zustand';
import { AppState } from '../state-types';
import { ECOSYSTEM_REGISTRY } from '../../services/ecosystem/registry';
import { resolveMotionContextBundle } from '../../services/ecosystem/contextResolver';
import { processContributionEvent, processSessionSummary } from '../../services/ecosystem/ingestion';
import { ContributionEvent, SessionSummary } from '../ecosystem-contracts';

/**
 * @file ecosystem.ts
 * @description Slice para gestão do ecossistema, contratos de contexto e ingestão governada.
 */

export const createEcosystemSlice: StateCreator<AppState, [], [], any> = (set, get) => ({
  miniAppRegistry: ECOSYSTEM_REGISTRY,
  lastContextBundle: null,
  longitudinalMemory: {},
  processedEventIds: [],
  ecosystemConfig: {},

  setEcosystemConfig: (appId: string, config: { enabled: boolean; influenceDisabled: boolean }) => {
    set(state => ({
      ecosystemConfig: {
        ...state.ecosystemConfig,
        [appId]: config
      }
    }));
    
    // Se desativar uma app, podemos querer limpar o bundle de contexto relacionado ou forçar refresh
    get().refreshContextBundle();
  },

  refreshContextBundle: () => {
    const bundle = resolveMotionContextBundle(get());
    set({ lastContextBundle: bundle });
    console.warn('[Shell] Context Bundle Refreshed:', bundle.bundle_status);
  },

  ingestContributionEvent: (event: ContributionEvent) => {
    const { longitudinalMemory, isDuplicate } = processContributionEvent(event, get());
    
    if (isDuplicate) {
      console.warn('[Shell] Evento ignorado (duplicado):', event.event_id);
      return;
    }

    set(state => ({
      longitudinalMemory,
      processedEventIds: [...state.processedEventIds, event.event_id]
    }));
    
    console.warn(`[Shell] Evento ingerido (${event.event_type}) da app ${event.miniapp_id}`);
    
    // Atualiza o bundle de contexto sempre que há nova informação relevante
    get().refreshContextBundle();
  },

  ingestSessionSummary: (summary: SessionSummary) => {
    const longitudinalMemory = processSessionSummary(summary, get());
    
    set({ longitudinalMemory });
    console.warn(`[Shell] Sumário de sessão ingerido da app ${summary.miniapp_id || 'N/A'}`);
  }
});

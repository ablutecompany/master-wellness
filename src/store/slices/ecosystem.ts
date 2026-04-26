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

  setEcosystemConfig: (appId: string, config: { 
    enabled: boolean; 
    influenceDisabled: boolean;
    participationDisabled?: boolean;
    retentionDays?: number;
  }) => {
    set(state => ({
      ecosystemConfig: {
        ...state.ecosystemConfig,
        [appId]: config
      }
    }));
    get().refreshContextBundle();
  },

  purgeEcosystemData: (appId: string) => {
    const entry = ECOSYSTEM_REGISTRY.find(e => e.miniapp_id === appId);
    if (!entry) return;

    set(state => {
      const nextMemory = { ...state.longitudinalMemory };
      // Limpa a entrada do domínio se for a única app, ou tenta filtrar (simplificado aqui para domínio)
      delete nextMemory[entry.domain];
      return { longitudinalMemory: nextMemory };
    });
    get().refreshContextBundle();
    console.warn(`[Shell] Dados da App ${appId} purgados por governação.`);
  },

  purgeDomainData: (domain: string) => {
    set(state => {
      const nextMemory = { ...state.longitudinalMemory };
      delete nextMemory[domain];
      return { longitudinalMemory: nextMemory };
    });
    get().refreshContextBundle();
    console.warn(`[Shell] Dados do Domínio ${domain} purgados por governação.`);
  },

  resetDemoData: () => {
    set({ 
      longitudinalMemory: {}, 
      processedEventIds: [],
      lastContextBundle: null 
    });
    console.warn(`[Shell] Estados persistidos resetados (DEMO Reset).`);
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

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
  ecosystemLogs: [],
  ecosystemConfig: {},
  longitudinalMemory: {},
  processedEventIds: [],
  lastContextBundle: null,
  miniAppRegistry: ECOSYSTEM_REGISTRY,

  addEcosystemLog: (log: Omit<import('../state-types').EcosystemLog, 'id' | 'timestamp'>) => {
    const newLog: import('../state-types').EcosystemLog = {
      ...log,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };
    set(state => ({
      ecosystemLogs: [newLog, ...state.ecosystemLogs].slice(0, 100)
    }));
  },

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
    get().addEcosystemLog({
      type: 'internal',
      appId,
      message: `Configuração de governação atualizada: ${config.enabled ? 'Ativo' : 'Desativado'}`,
      status: 'success'
    });
  },

  purgeEcosystemData: (appId: string) => {
    const entry = ECOSYSTEM_REGISTRY.find(e => e.miniapp_id === appId);
    if (!entry) return;

    set(state => {
      const nextMemory = { ...state.longitudinalMemory };
      delete nextMemory[entry.domain];
      return { longitudinalMemory: nextMemory };
    });
    get().refreshContextBundle();
    get().addEcosystemLog({
      type: 'internal',
      appId,
      domain: entry.domain,
      message: `Dados purgados por governação (Módulo: ${appId})`,
      status: 'warning'
    });
  },

  purgeDomainData: (domain: string) => {
    set(state => {
      const nextMemory = { ...state.longitudinalMemory };
      delete nextMemory[domain];
      return { longitudinalMemory: nextMemory };
    });
    get().refreshContextBundle();
    get().addEcosystemLog({
      type: 'internal',
      domain,
      message: `Dados do domínio ${domain} purgados.`,
      status: 'warning'
    });
  },

  resetDemoData: () => {
    set({ 
      longitudinalMemory: {}, 
      processedEventIds: [],
      lastContextBundle: null,
      ecosystemLogs: []
    });
    console.warn(`[Shell] Estados persistidos resetados (DEMO Reset).`);
  },

  refreshContextBundle: () => {
    const bundle = resolveMotionContextBundle(get());
    set({ lastContextBundle: bundle });
    // Log opcional para não poluir demasiado
  },

  ingestContributionEvent: (event: ContributionEvent) => {
    const { longitudinalMemory, isDuplicate, status, reason } = processContributionEvent(event, get());
    
    if (status === 'blocked' || status === 'error') {
      get().addEcosystemLog({
        type: 'blocked',
        appId: event.miniapp_id,
        message: `Ingestão Bloqueada: ${reason || 'Desconhecido'}`,
        status: status === 'error' ? 'error' : 'governance_block',
        payload: { event_type: event.event_type }
      });
      return;
    }

    set(state => ({
      longitudinalMemory,
      processedEventIds: [...state.processedEventIds, event.event_id]
    }));
    
    get().addEcosystemLog({
      type: 'incoming',
      appId: event.miniapp_id,
      domain: ECOSYSTEM_REGISTRY.find(e => e.miniapp_id === event.miniapp_id)?.domain,
      message: `Sucesso: Ingestão de ${event.event_type}`,
      status: 'success',
      payload: event.payload
    });
    
    get().refreshContextBundle();
  },

  ingestSessionSummary: (summary: SessionSummary) => {
    const { longitudinalMemory, status, reason } = processSessionSummary(summary, get());
    
    if (status === 'blocked' || status === 'error') {
       get().addEcosystemLog({
        type: 'blocked',
        appId: summary.miniapp_id,
        message: `Sumário Bloqueado: ${reason || 'Desconhecido'}`,
        status: status === 'error' ? 'error' : 'governance_block'
      });
      return;
    }

    set({ longitudinalMemory });
    
    get().addEcosystemLog({
      type: 'incoming',
      appId: summary.miniapp_id,
      message: `Sumário de sessão ingerido (Status: ${summary.outcome_status})`,
      status: 'success',
      payload: { credits: summary.consumed_credits }
    });
  }
});

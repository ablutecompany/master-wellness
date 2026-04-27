// @ts-nocheck
import { AppState, ContextFact, DomainPackage } from './types';
import { computeSemanticFromMeasurements } from '../services/semantic-output/index';
import { normalizeEvent, filterActiveFacts } from '../services/contributions-normalizer';

/**
 * Camada de Selectors (Adapters de Leitura)
 * Objetivo: Desacoplar os componentes da estrutura interna do store.
 */

// Cache global para estabilidade referencial absoluta em modo Demo
let _demoMeasurementsCache = null;
let _demoContextualCache = null;
let _lastDemoDataRef = null;
let _dataFreshnessCache = null;
let _lastFreshnessInput = { measCount: 0, lastTs: 0, refNow: 0, mode: false };
let _aiConfidenceCache = null;
let _lastAiConfidenceInput = { measCount: 0, expCount: 0, freshStatus: '', mode: false };
let _dailySynthesisCache = null;
let _lastDailySynthesisInput = { aiLevel: '', freshStatus: '' };

// ─────────────────────────────────────────────────────────────────────────────
// A) Profile Selectors
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
export const selectHousehold = (state: AppState) => state.household;
export const selectActiveMemberId = (state: AppState) => state.activeMemberId;

export const selectUser = (state: AppState) => {
  if (state.isGuestMode) return state.guestProfile;
  if (state.household && state.activeMemberId) {
    const activeMember = state.household.members.find(m => m.id === state.activeMemberId);
    if (activeMember) return activeMember.profile;
  }
  return state.user;
};

export const selectUserName = (state: AppState) => {
  const user = selectUser(state);
  return user?.name || (state.isGuestMode ? 'Convidada' : 'Utilizadora');
};
export const selectCredits = (state: AppState) => state.credits ?? 0;
export const selectIsGuestMode = (state: AppState) => state.isGuestMode;

// ─────────────────────────────────────────────────────────────────────────────
// B) Visibility Core Logic
// ─────────────────────────────────────────────────────────────────────────────
export const canViewTargetData = (state: AppState, targetMemberId: string, scope: 'results' | 'context') => {
  // If I am the Root owner, I see everything in my household
  if (state.household?.ownerId && state.user?.id && state.household.ownerId === state.user.id) return true;
  
  // If looking at myself
  const myMemberEntry = state.household?.members?.find(m => m.userId === state.user?.id);
  if (myMemberEntry && targetMemberId === myMemberEntry.id) return true;

  // Otherwise, respect permissions of the target
  const targetMember = state.household?.members?.find(m => m.id === targetMemberId);
  if (!targetMember) return !!myMemberEntry; // fallback local safely
  
  const perm = targetMember.permissions?.[scope];
  const targetIds = targetMember.permissions?.[`${scope}TargetIds`] || [];

  if (perm === 'shared_household') return true;
  if (perm === 'shared_selective' && myMemberEntry && targetIds.includes(myMemberEntry.id)) return true;
  
  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// C) Measurement Selectors
// ─────────────────────────────────────────────────────────────────────────────

export const selectMeasurements = (state: AppState) => {
  if (state.isDemoMode && state.demoAnalysis) {
    if (_lastDemoDataRef === state.demoAnalysis && _demoMeasurementsCache) {
       return _demoMeasurementsCache;
    }
    
    _lastDemoDataRef = state.demoAnalysis;
    _demoMeasurementsCache = (state.demoAnalysis.measurements || []).map(m => ({
      id: m.id,
      memberId: 'demo-member',
      type: m.type,
      marker: m.marker,
      value: m.value,
      unit: m.unit,
      timestamp: m.timestamp
    }));
    return _demoMeasurementsCache;
  }

  const allMeasurements = state.measurements || [];
  if (state.activeMemberId) {
    if (!canViewTargetData(state, state.activeMemberId, 'results')) return [];
    return allMeasurements.filter(m => m.memberId === state.activeMemberId);
  }
  // When activeMemberId is null, we are viewing the Root owner's profile.
  // We must filter out any measurements belonging to dependent members.
  // We assume Root measurements have no memberId or memberId === state.user.id
  return allMeasurements.filter(m => !m.memberId || (state.user && m.memberId === state.user.id));
};

export const selectHasResultsAccess = (state: AppState) => {
  if (state.activeMemberId) return canViewTargetData(state, state.activeMemberId, 'results');
  return true;
};

export const selectHasContextAccess = (state: AppState) => {
  if (state.activeMemberId) return canViewTargetData(state, state.activeMemberId, 'context');
  return true;
};

export const selectHasMeasurements = (state: AppState) => selectMeasurements(state).length > 0;
export const selectLatestMeasurements = (state: AppState, limit = 5) => 
  selectMeasurements(state).slice(0, limit);
export const selectMeasurementsCount = (state: AppState) => selectMeasurements(state).length;
export const selectMeasurementsByType = (state: AppState, type: string) => 
  selectMeasurements(state).filter(m => m.type === type);

export const selectLatestMeasurement = (state: AppState) => selectMeasurements(state)[0];

export const selectDaysSinceLastMeasurement = (state: AppState) => {
  const measurements = selectMeasurements(state);
  if (measurements.length === 0) return 0;
  const latest = Math.max(...measurements.map(m => m.timestamp));
  // In demo mode or static contexts, use a stable "now" from state if available
  const now = state.lastContextBundle?.timestamp || Date.now();
  const diff = now - latest;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export type DataFreshnessState = 
  | 'syncing'
  | 'sync_failed'
  | 'no_access'
  | 'no_data'
  | 'recent'
  | 'stale'
  | 'very_stale'
  | 'no_device';

export interface DataFreshnessBundle {
  status: DataFreshnessState;
  label: string;
  color: string;
  daysSince: number | null;
  actionLabel: string;
  actionIntent: 'manage_permissions' | 'wait' | 'sync_now' | 'analyze' | 're_sync';
  temporalLabel: string;
}

const formatTemporalLabel = (ts: number | null, referenceNow: number): string => {
   if (!ts || isNaN(ts)) return 'Sem sincronizações';
   const date = new Date(ts);
   const now = new Date(referenceNow);
   const diffMs = referenceNow - date.getTime();
   const daysDiff = Math.floor(diffMs / (1000 * 3600 * 24));
   
   const hh = date.getHours().toString().padStart(2, '0');
   const mm = date.getMinutes().toString().padStart(2, '0');
   const hm = `${hh}:${mm}`;

   if (daysDiff === 0 && now.getDate() === date.getDate()) {
       return `Última sincronização hoje às ${hm}`;
   } else if (daysDiff === 1 || (daysDiff === 0 && now.getDate() !== date.getDate())) {
       return `Última sincronização ontem às ${hm}`;
   } else {
       const d = date.getDate().toString().padStart(2, '0');
       const m = (date.getMonth() + 1).toString().padStart(2, '0');
       const y = date.getFullYear();
       return `Sincronizado a ${d}/${m}/${y}`;
   }
};

export const selectDataFreshness = (state: AppState, forcedMemberId?: string): DataFreshnessBundle => {
  const targetId = forcedMemberId || state.activeMemberId || (state.user ? state.user.id : null);
  
  // 1. Permissões vêm primeiro. Se for restrito, a ausência de acesso NÃO É erro técnico.
  if (targetId) {
     const hasAccess = canViewTargetData(state, targetId, 'results');
     if (!hasAccess) {
       return { status: 'no_access', label: '🔒 Acesso Restrito', color: '#FF6060', daysSince: null, actionLabel: 'Gerir Autorizações', actionIntent: 'manage_permissions', temporalLabel: 'Protegido por privacidade ativa' };
     }
  }

  // 2. Operações em curso preemptive over data age
  if (state.isMeasuring || state.isNfcLoading) {
      return { status: 'syncing', label: 'A Sincronizar Sinais...', color: '#00F2FF', daysSince: null, actionLabel: 'Aguarde...', actionIntent: 'wait', temporalLabel: 'A receber novos sinais...' };
  }

  // 3. Resgate isolado por membro
  let myMeas = state.measurements || [];
  if (targetId) {
     const isRoot = state.household?.ownerId === targetId || state.user?.id === targetId;
     if (isRoot) {
        myMeas = myMeas.filter(m => !m.memberId || m.memberId === targetId);
     } else {
        myMeas = myMeas.filter(m => m.memberId === targetId);
     }
  }

  if (myMeas.length === 0) {
      return { status: 'no_data', label: 'Aguardando Sincronização', color: 'rgba(255,255,255,0.4)', daysSince: null, actionLabel: 'Iniciar Sincronização', actionIntent: 'sync_now', temporalLabel: 'Sem recolhas registadas ainda' };
  }

  // 4. Frescura Temporal
  const latestTs = Math.max(...myMeas.map(m => new Date(m.timestamp).getTime() || 0));
  if (!latestTs || isNaN(latestTs)) return { status: 'no_data', label: 'Sinais Ausentes', color: 'rgba(255,255,255,0.4)', daysSince: null, actionLabel: 'Recolher Sinais', actionIntent: 'sync_now', temporalLabel: 'Sem base temporal válida' };

  // Use state-bound reference for "now" to avoid floating references in loops
  // Fallback to a fixed stable timestamp if lastContextBundle is not yet available
  const referenceNow = state.lastContextBundle?.timestamp || 1714172400000;
  
  // Cache check
  if (_dataFreshnessCache && 
      _lastFreshnessInput.measCount === myMeas.length && 
      _lastFreshnessInput.lastTs === latestTs && 
      _lastFreshnessInput.refNow === referenceNow &&
      _lastFreshnessInput.mode === state.isDemoMode) {
     return _dataFreshnessCache;
  }

  const diffMs = referenceNow - latestTs;
  const daysDiff = Math.floor(diffMs / (1000 * 3600 * 24));
  const tLabel = formatTemporalLabel(latestTs, referenceNow);

  let result: DataFreshnessBundle;

  if (daysDiff < 3) {
      result = { status: 'recent', label: 'Última sincronização recente', color: '#00D4AA', daysSince: daysDiff, actionLabel: 'Explorar Análise', actionIntent: 'analyze', temporalLabel: tLabel };
  } else if (daysDiff <= 14) {
      result = { status: 'stale', label: 'Sinais desatualizados', color: '#FFA500', daysSince: daysDiff, actionLabel: 'Sincronizar Novamente', actionIntent: 're_sync', temporalLabel: tLabel };
  } else {
      result = { status: 'very_stale', label: 'Sinais muito antigos', color: '#FF6060', daysSince: daysDiff, actionLabel: 'Sincronizar Urgente', actionIntent: 're_sync', temporalLabel: tLabel };
  }

  // Update cache
  _dataFreshnessCache = result;
  _lastFreshnessInput = { measCount: myMeas.length, lastTs: latestTs, refNow: referenceNow, mode: state.isDemoMode };
  
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// C) Insight Selectors (DEPRECATED - Use SemanticOutput Bundle)
// ─────────────────────────────────────────────────────────────────────────────
// Fonte de verdade migrada para semanticOutputService.getBundle()
// Antigos seletores de themeScores e globalScore removidos.

// ─────────────────────────────────────────────────────────────────────────────
// D) App Runtime Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectInstalledAppIds = (state: AppState) => state.installedAppIds || [];
export const selectActiveApp = (state: AppState) => state.activeApp;
export const selectIsAppInstalled = (state: AppState, appId: string) => 
  (state.installedAppIds || []).includes(appId);

// ─────────────────────────────────────────────────────────────────────────────
// E) Permission Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectGrantedPermissions = (state: AppState) => state.grantedPermissions || {};
export const selectAppPermissions = (state: AppState, appId: string) => 
  (state.grantedPermissions || {})[appId] || [];

// ─────────────────────────────────────────────────────────────────────────────
// F) Mini-App Contribution Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectAppContributionEvents = (state: AppState) => {
  const allEvents = state.appContributionEvents || [];
  if (state.activeMemberId) {
    if (!canViewTargetData(state, state.activeMemberId, 'context')) return [];
    return allEvents.filter(e => e.memberId === state.activeMemberId);
  }
  // When activeMemberId is null, we strictly return the Root owner's events.
  return allEvents.filter(e => !e.memberId || (state.user && e.memberId === state.user.id));
};

export const selectAppContributionsByApp = (state: AppState, appId: string) => 
  selectAppContributionEvents(state).filter(e => e.sourceAppId === appId);

export const selectExportedContexts = (state: AppState) => {
  const allContexts = state.exportedContexts || [];
  if (state.activeMemberId) {
    if (!canViewTargetData(state, state.activeMemberId, 'context')) return [];
    return allContexts.filter(c => c.memberId === state.activeMemberId);
  }
  // When activeMemberId is null, we strictly return the Root owner's context.
  return allContexts.filter(c => !c.memberId || (state.user && c.memberId === state.user.id));
};

// ─────────────────────────────────────────────────────────────────────────────
// G) UI Operational Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectIsNfcLoading = (state: AppState) => state.isNfcLoading;
export const selectIsMeasuring = (state: AppState) => state.isMeasuring;
// ─────────────────────────────────────────────────────────────────────────────
// H) Derived Context Selectors (Normalização Longitudinal)
// ─────────────────────────────────────────────────────────────────────────────
export const selectDerivedContextFacts = (state: AppState): ContextFact[] => 
  (state.appContributionEvents || []).map(normalizeEvent);

export const selectActiveDerivedContextFacts = (state: AppState): ContextFact[] => 
  filterActiveFacts(selectDerivedContextFacts(state));

export const selectActiveFactsByDomain = (state: AppState, domain: ContextFact['domain']): ContextFact[] => 
  selectActiveDerivedContextFacts(state).filter(f => f.domain === domain);

export const selectLongitudinalMemory = (state: AppState) => state.longitudinalMemory || {};

export const selectEcosystemConfig = (state: AppState) => state.ecosystemConfig || {};

export const selectIsAppParticipationAllowed = (state: AppState, appId: string) => {
  const config = (state.ecosystemConfig || {})[appId];
  if (!config) return true;
  return !config.participationDisabled;
};

export const selectContextualResults = (state: AppState) => {
   if (state.isDemoMode && state.demoAnalysis) {
      if (_lastDemoDataRef === state.demoAnalysis && _demoContextualCache) {
         return _demoContextualCache;
      }
      _lastDemoDataRef = state.demoAnalysis;
      _demoContextualCache = state.demoAnalysis.ecosystemFacts || [];
      return _demoContextualCache;
   }

   const memory = selectLongitudinalMemory(state);
   const config = state.ecosystemConfig || {};
   const registry = state.miniAppRegistry || [];
   
   return Object.keys(memory)
    .filter(domain => {
      const appsInDomain = registry.filter(r => r.domain === domain);
      if (appsInDomain.length === 0) return true;
      return appsInDomain.some(app => !config[app.miniapp_id]?.participationDisabled);
    })
    .map(domain => ({
      domain,
      origin_mode: memory[domain].origin_mode || 'ecosystem',
      contribution_type: memory[domain].contribution_type || 'hybrid',
      ...memory[domain]
    }));
};

// ─────────────────────────────────────────────────────────────────────────────
// I) AI Confidence Selectors (Bioanálise Readiness)
// ─────────────────────────────────────────────────────────────────────────────
export type AiConfidenceLevel = 'robusta' | 'contextual' | 'limitada' | 'insuficiente';

export interface AiConfidenceBundle {
  level: AiConfidenceLevel;
  label: string;
  color: string;
  rationale: string;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendedAction: {
    label: string;
    intent: 'sync_now' | 'manage_permissions' | 'complete_profile' | 'open_context' | 'explore_analysis' | 'wait';
  };
}

/*
export const selectPriorityChange = (state: AppState): number => {
  const analyses = (state.analyses || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (analyses.length < 2) return 0;
  return (analyses[0].priorityScore || 0) - (analyses[1].priorityScore || 0);
};
*/

export const selectAiConfidence = (state: AppState, forcedMemberId?: string): AiConfidenceBundle => {
  const targetId = forcedMemberId || state.activeMemberId || (state.user ? state.user.id : null);
  
  if (targetId) {
     const hasAccess = canViewTargetData(state, targetId, 'context');
     if (!hasAccess) {
        return {
           level: 'insuficiente',
           label: 'Privacidade Ativa',
           color: '#FF6060', // Crimson red for strict stops
           rationale: 'O acesso à interpretação semântica biológica deste membro foi barrado explicitamente.',
           factors: { positive: [], negative: ['Acesso restrito a dados do membro'] },
           recommendedAction: { label: 'Gerir Permissões', intent: 'manage_permissions' }
        };
     }
  }

  const freshness = selectDataFreshness(state, forcedMemberId);
  
  let myMeas = state.measurements || [];
  let exported = state.exportedContexts || [];
  
  if (targetId) {
     const isRoot = state.household?.ownerId === targetId || state.user?.id === targetId;
     if (isRoot) {
        myMeas = myMeas.filter(m => !m.memberId || m.memberId === targetId);
        exported = exported.filter(c => !c.memberId || c.memberId === targetId);
     } else {
        myMeas = myMeas.filter(m => m.memberId === targetId);
        exported = exported.filter(c => c.memberId === targetId);
     }
  }
  
  const hasFreshData = freshness.status === 'recent';
  const hasStaleData = freshness.status === 'stale';
  const signalCount = myMeas.length;
  const hasContext = exported.length > 0;

  // Cache check
  if (_aiConfidenceCache &&
      _lastAiConfidenceInput.measCount === signalCount &&
      _lastAiConfidenceInput.expCount === exported.length &&
      _lastAiConfidenceInput.freshStatus === freshness.status &&
      _lastAiConfidenceInput.mode === state.isDemoMode) {
     return _aiConfidenceCache;
  }
  
  const positive: string[] = [];
  const negative: string[] = [];

  if (hasFreshData) positive.push('Base de sinais temporalmente recente');
  if (hasContext) positive.push('Contexto comportamental/nutritivo ativo');
  if (signalCount >= 4) positive.push('Volume robusto de biometrias cruzadas');
  
  if (!hasFreshData && !hasStaleData && signalCount > 0) negative.push('Sinais severamente desatualizados');
  if (signalCount > 0 && signalCount < 3) negative.push('Poucos sinais recolhidos');
  if (!hasContext) negative.push('Sem ligação a apps externas de contexto');

  let result: AiConfidenceBundle;

  if (signalCount === 0) {
      result = {
         level: 'insuficiente',
         label: 'Base Mínima Insuficiente',
         color: 'rgba(255,255,255,0.4)',
         rationale: 'Não existem dados fisiológicos para sustentar análises dedutivas seguras.',
         factors: { positive, negative: ['Ausência total de histórico biométrico', ...negative] },
         recommendedAction: { label: 'Iniciar Sincronização', intent: 'sync_now' }
      };
  } else if (freshness.status === 'very_stale') {
      result = {
         level: 'limitada',
         label: 'Leitura Obsoleta Limitada',
         color: '#FF6060',
         rationale: 'A base de sinais está severamente expirada. A interpretação servirá apenas para referencial antigo.',
         factors: { positive, negative },
         recommendedAction: { label: 'Sincronizar Novos Dados', intent: 'sync_now' }
      };
  } else if (signalCount < 3) {
      result = {
         level: 'limitada',
         label: 'Leitura Fisiológica Limitada',
         color: '#FFA500',
         rationale: 'O volume de sinais é baixo limitando a qualidade cruzada do motor semântico.',
         factors: { positive, negative },
         recommendedAction: { label: 'Completar Perfil Base', intent: 'complete_profile' }
      };
  } else if (hasFreshData && hasContext && signalCount >= 4) {
      result = {
         level: 'robusta',
         label: 'Leitura Integral Robusta',
         color: '#00D4AA',
         rationale: 'Sustentada por sinais recentes abundantes fundidos perfeitamente ao contexto exportado.',
         factors: { positive, negative },
         recommendedAction: { label: 'Explorar Análise', intent: 'explore_analysis' }
      };
  } else if (hasFreshData || hasStaleData) {
      if (hasContext) {
          result = {
             level: 'contextual',
             label: 'Leitura Híbrida',
             color: '#00F2FF',
             rationale: 'As lacunas em sinais ou idade fisiológica são contrabalançadas pelo motor contextual contínuo external.',
             factors: { positive, negative },
             recommendedAction: { label: 'Atualizar Sinais Base', intent: 'sync_now' }
          };
      } else {
          result = {
             level: 'limitada',
             label: 'Leitura Isolada',
             color: '#FFA500',
             rationale: 'A ausência de contexto de estilo de vida limita as inferências às medições clínicas cegas puras.',
             factors: { positive, negative },
             recommendedAction: { label: 'Atrair Contexto Externo', intent: 'open_context' }
          };
      }
  } else {
      result = {
          level: 'insuficiente',
          label: 'Qualidade Inconclusiva',
          color: 'rgba(255,255,255,0.4)',
          rationale: 'Base biológica e/ou de contexto está inacessível. Recomendada nova sincronização prévia.',
          factors: { positive, negative },
          recommendedAction: { label: 'Sincronizar Cargas', intent: 'sync_now' }
      };
  }

  // Update cache
  _aiConfidenceCache = result;
  _lastAiConfidenceInput = { measCount: signalCount, expCount: exported.length, freshStatus: freshness.status, mode: state.isDemoMode };
  
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// J) UNIFIED CHRONO FEED SELECTOR (System Log / Timeline)
// ─────────────────────────────────────────────────────────────────────────────
export type ChronoEventType = 'sync_success' | 'sync_failed' | 'measurement_received' | 'analysis_updated' | 'context_updated' | 'invite_sent' | 'invite_accepted' | 'permission_changed';

export interface ChronoEvent {
   id: string; 
   timestamp: number;
   type: ChronoEventType;
   memberId: string | null;
   label: string;
   payload: string; 
   color?: string; // Optional hex for UI grouping
}

export const selectUnifiedTimeline = (state: AppState): ChronoEvent[] => {
   const events: ChronoEvent[] = [];
   const rootId = state.user?.id || 'root-guest';
   const activeId = state.activeMemberId || rootId;

   const canView = (targetId: string, domain: 'results' | 'context') => {
      return canViewTargetData(state, targetId, domain);
   };

   // 1. Measurements (measurement_received)
   if (state.measurements) {
      state.measurements.forEach((m: any) => {
          const owner = m.memberId || rootId;
          if (activeId !== rootId && owner !== activeId) return; 
          if (!canView(owner, 'results')) return;

          events.push({
             id: `meas_${m.id}`,
             timestamp: m.timestamp || 1714172400000,
             type: 'measurement_received',
             memberId: owner,
             label: 'Recolha Geométrica',
             payload: `Recebido sinal vital novo`,
             color: '#00F2FF'
          });
      });
   }

   // 2. Analyses (sync_success)
   if (state.analyses) {
      state.analyses.forEach((a: any) => {
          const owner = a.memberId || rootId;
          if (activeId !== rootId && owner !== activeId) return;
          if (!canView(owner, 'results')) return;

          const ts = new Date(a.createdAt).getTime();
          events.push({
             id: `ana_${a.id}`,
             timestamp: !isNaN(ts) ? ts : 1714172400000,
             type: 'sync_success',
             memberId: owner,
             label: 'Sincronização Integrada',
             payload: `Carga paramétrica estabilizada com biometria total`,
             color: '#00D4AA'
          });
      });
   }

   // 3. Exported Contexts (context_updated)
   if (state.exportedContexts) {
      state.exportedContexts.forEach((c: any) => {
         const owner = c.memberId || rootId;
         if (activeId !== rootId && owner !== activeId) return;
         if (!canView(owner, 'context')) return;

         const ts = new Date(c.updatedAt || 1714172400000).getTime();
         events.push({
             id: `ctx_${c.id}`,
             timestamp: !isNaN(ts) ? ts : 1714172400000,
             type: 'context_updated',
             memberId: owner,
             label: 'Contexto Interligado',
             payload: `Motor comportamental externo inferiu dados`,
             color: '#A020F0'
          });
      });
   }

   // 4. Household Events
   if (state.household && state.household.members) {
      if (activeId === rootId) {
         state.household.members.forEach((m: any) => {
            const hasJoined = !!m.userId;
            const ts = new Date(hasJoined ? m.updatedAt : m.createdAt).getTime();

            events.push({
                id: `mem_${m.id}_state`,
                timestamp: !isNaN(ts) ? ts : Date.now(),
                type: hasJoined ? 'invite_accepted' : 'invite_sent',
                memberId: m.id,
                label: hasJoined ? 'Membro Conectado' : 'Convite Emitido',
                payload: hasJoined ? `Acesso digital confirmado e emparelhado` : `Aguardando aceitação de dispositivo seguro`,
                color: hasJoined ? '#00D4AA' : '#FFA500'
            });

            if (m.updatedAt && m.createdAt && m.updatedAt !== m.createdAt && hasJoined) {
                const ts2 = new Date(m.updatedAt).getTime();
                events.push({
                   id: `mem_${m.id}_perm`,
                   timestamp: !isNaN(ts2) ? ts2 : Date.now(),
                   type: 'permission_changed',
                   memberId: m.id,
                   label: 'Privacidade Atualizada',
                   payload: `Esquema permissivo partilhado foi modificado`,
                   color: '#FF6060'
                });
            }
         });
      } else {
         const self = state.household.members.find(m => m.id === activeId);
         if (self && self.updatedAt !== self.createdAt) {
                const ts2 = new Date(self.updatedAt).getTime();
                events.push({
                   id: `mem_${self.id}_perm`,
                   timestamp: !isNaN(ts2) ? ts2 : Date.now(),
                   type: 'permission_changed',
                   memberId: self.id,
                   label: 'Privacidade Atualizada',
                   payload: `Restrição canónica do próprio membro aplicada`,
                   color: '#FF6060'
                });
         }
      }
   }

   // Merge matching timestamps explicitly? No, direct sort descending
   return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50); // Keep it useful size
};

// ─────────────────────────────────────────────────────────────────────────────
// K) DAILY SYNTHESIS (Briefing Operacional)
// ─────────────────────────────────────────────────────────────────────────────
export interface DailySynthesis {
  status: 'excellent' | 'good' | 'needs_attention' | 'critical' | 'restricted';
  title: string;
  positiveHighlight: string | null;
  negativeHighlight: string | null;
  action: {
    label: string;
    intent: 'sync_now' | 'manage_permissions' | 'complete_profile' | 'explore_analysis' | 'open_context' | 'open_timeline' | 'wait';
  };
}

export const selectDailySynthesis = (state: AppState, forcedMemberId?: string): DailySynthesis => {
   const aiConfidence = selectAiConfidence(state, forcedMemberId);
   const freshness = selectDataFreshness(state, forcedMemberId);
   
   // Cache check
   if (_dailySynthesisCache &&
       _lastDailySynthesisInput.aiLevel === aiConfidence.level &&
       _lastDailySynthesisInput.freshStatus === freshness.status) {
      return _dailySynthesisCache;
   }

   let result: DailySynthesis;

   if (aiConfidence.level === 'insuficiente' && freshness.status === 'no_access') {
       result = {
           status: 'restricted',
           title: 'Acesso Fechado',
           positiveHighlight: null,
           negativeHighlight: 'O membro ocultou os seus biomarcadores base.',
           action: { label: 'Gerir Permissões', intent: 'manage_permissions' }
       };
   } else if (freshness.status === 'no_data' || aiConfidence.level === 'insuficiente') {
       result = {
           status: 'critical',
           title: 'Sinais Inexistentes',
           positiveHighlight: aiConfidence.factors.positive[0] || null,
           negativeHighlight: aiConfidence.factors.negative[0] || 'Sem dados gravados na pool ativa.',
           action: { label: 'Iniciar Recolha', intent: 'sync_now' }
       };
   } else if (freshness.status === 'very_stale' || aiConfidence.level === 'limitada') {
       result = {
           status: 'needs_attention',
           title: 'Atenção Fisiológica',
           positiveHighlight: aiConfidence.factors.positive[0] || null,
           negativeHighlight: aiConfidence.factors.negative[0] || 'Base degradada precisa de cuidado orgânico.',
           action: { label: 'Re-Sincronizar', intent: 'sync_now' }
       };
   } else if (aiConfidence.level === 'contextual') {
       result = {
           status: 'good',
           title: 'Estabilidade Assistida',
           positiveHighlight: aiConfidence.factors.positive[0] || 'Atividade orgânica saudável assente no contexto.',
           negativeHighlight: aiConfidence.factors.negative[0] || null,
           action: { label: 'Avaliar Período', intent: 'open_timeline' }
       };
   } else {
       result = {
           status: 'excellent',
           title: 'Ecossistema Maduro',
           positiveHighlight: aiConfidence.factors.positive[0] || 'Base está atualizada e altamente robusta.',
           negativeHighlight: null,
           action: { label: 'Abrir Resumo', intent: 'open_timeline' }
       };
   }

   // Update cache
   _dailySynthesisCache = result;
   _lastDailySynthesisInput = { aiLevel: aiConfidence.level, freshStatus: freshness.status };
   
   return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// L) SHELL PRIORITY CHANGE (Tendência Principal Útil)
// ─────────────────────────────────────────────────────────────────────────────
export interface PriorityChange {
   domainLabel: string;
   priority: 'discrete' | 'relevant' | 'critical';
   direction: 'improving' | 'worsening';
   shortLabel: string;
}

export const selectPriorityChange = (state: AppState, forcedMemberId?: string): PriorityChange | null => {
    const targetId = forcedMemberId || state.activeMemberId;
    if (!targetId || !state.analyses) return null;

    // Apenas analisa leituras com base legível e não demo
    const memberAnalyses = state.analyses.filter(a => a.memberId === targetId && a.source !== 'demo')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (memberAnalyses.length < 2) return null;

    const latest = memberAnalyses[0];
    const prev = memberAnalyses[1];

    if (!latest.measurements || !prev.measurements) return null;

    const latestState = computeSemanticFromMeasurements(latest.measurements, latest.ecosystemFacts || []);
    const prevState = computeSemanticFromMeasurements(prev.measurements, prev.ecosystemFacts || []);

    let topChange: PriorityChange | null = null;
    let maxDiff = 0;

    const labels: Record<string, string> = {
        sleep: 'Qualidade do Sono',
        nutrition: 'Equilíbrio Metabólico',
        general: 'Ablute Wellness',
        energy: 'Energia Biológica',
        recovery: 'Capacidade de Recuperação',
        performance: 'Capacidade de Desempenho'
    };

    Object.keys(latestState.domains).forEach(domKey => {
        const currentScore = latestState.domains[domKey].score;
        const prevScore = prevState.domains[domKey]?.score;

        if (typeof currentScore === 'number' && typeof prevScore === 'number') {
            const diff = currentScore - prevScore;
            const absDiff = Math.abs(diff);

            if (absDiff >= 2 && absDiff > maxDiff) {
                maxDiff = absDiff;
                const priority = absDiff >= 15 ? 'critical' : (absDiff >= 5 ? 'relevant' : 'discrete');
                const direction = diff > 0 ? 'improving' : 'worsening';
                
                topChange = {
                    domainLabel: labels[domKey] || domKey,
                    priority,
                    direction,
                    shortLabel: direction === 'improving' ? 'Melhoria Relevante' : 'Atenção Focada'
                };
            }
        }
    });

    return topChange;
};

// ─────────────────────────────────────────────────────────────────────────────
// M) WEEKLY BRIEFING (Resumo Longitudinal Curto)
// ─────────────────────────────────────────────────────────────────────────────
export interface WeeklyBriefing {
  status: 'empty' | 'insufficient' | 'good' | 'excellent';
  stabilityLabel: string;
  changeLabel: string | null;
  gapLabel: string | null;
  action: {
    label: string;
    intent: 'sync_now' | 'manage_permissions' | 'explore_analysis' | 'open_context';
  };
}

export const selectWeeklyBriefing = (state: AppState, forcedMemberId?: string): WeeklyBriefing | null => {
    const targetId = forcedMemberId || state.activeMemberId;
    if (!targetId || !state.analyses) return null;

    const freshness = selectDataFreshness(state, targetId);
    if (freshness.status === 'no_access') {
       return {
         status: 'empty',
         stabilityLabel: 'Sem acesso a dados biográficos',
         changeLabel: null,
         gapLabel: 'O membro tem a partilha fechada ou oculta.',
         action: { label: 'Gerir Permissões', intent: 'manage_permissions' }
       };
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const memberAnalyses = state.analyses.filter(a => a.memberId === targetId && a.source !== 'demo')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const recentAnalyses = memberAnalyses.filter(a => new Date(a.createdAt).getTime() > sevenDaysAgo);

    if (recentAnalyses.length === 0) {
       return {
         status: 'insufficient',
         stabilityLabel: 'Ciclo biográfico inativo',
         changeLabel: null,
         gapLabel: 'Nenhum registo consolidado nos últimos 7 dias.',
         action: { label: 'Iniciar Sincronização', intent: 'sync_now' }
       };
    }

    const priorityChange = selectPriorityChange(state, targetId);
    let changeText = 'Sem variações críticas registadas.';
    if (priorityChange) {
        changeText = priorityChange.direction === 'improving' 
          ? `Evolução consolidada: ${priorityChange.domainLabel}.` 
          : `Foco sugerido na ${priorityChange.domainLabel}.`;
    }

    const aiConfidence = selectAiConfidence(state, targetId);
    const gapText = aiConfidence.factors.negative[0] || 'Base de correlações estável e contínua.';

    return {
       status: priorityChange && priorityChange.priority === 'critical' ? 'good' : 'excellent',
       stabilityLabel: `${recentAnalyses.length} registo(s) ativo(s) na janela de 7 dias.`,
       changeLabel: changeText,
       gapLabel: gapText,
       action: { label: 'Avaliar Detalhe', intent: 'explore_analysis' }
    };
};

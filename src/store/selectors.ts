import { AppState, ContextFact, DomainPackage } from './types';
import { normalizeEvent, filterActiveFacts } from '../services/contributions-normalizer';

/**
 * Camada de Selectors (Adapters de Leitura)
 * Objetivo: Desacoplar os componentes da estrutura interna do store.
 */

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
  const diff = Date.now() - latest;
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

const formatTemporalLabel = (ts: number | null): string => {
   if (!ts || isNaN(ts)) return 'Sem sincronizações';
   const date = new Date(ts);
   const now = new Date();
   const diffMs = now.getTime() - date.getTime();
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

  const diffMs = Date.now() - latestTs;
  const daysDiff = Math.floor(diffMs / (1000 * 3600 * 24));
  const tLabel = formatTemporalLabel(latestTs);

  if (daysDiff < 3) {
      return { status: 'recent', label: 'Última sincronização recente', color: '#00D4AA', daysSince: daysDiff, actionLabel: 'Explorar Análise', actionIntent: 'analyze', temporalLabel: tLabel };
  } else if (daysDiff <= 14) {
      return { status: 'stale', label: 'Sinais desatualizados', color: '#FFA500', daysSince: daysDiff, actionLabel: 'Sincronizar Novamente', actionIntent: 're_sync', temporalLabel: tLabel };
  } else {
      return { status: 'very_stale', label: 'Sinais muito antigos', color: '#FF6060', daysSince: daysDiff, actionLabel: 'Sincronizar Urgente', actionIntent: 're_sync', temporalLabel: tLabel };
  }
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
  
  const positive: string[] = [];
  const negative: string[] = [];

  if (hasFreshData) positive.push('Base de sinais temporalmente recente');
  if (hasContext) positive.push('Contexto comportamental/nutritivo ativo');
  if (signalCount >= 4) positive.push('Volume robusto de biometrias cruzadas');
  
  if (!hasFreshData && !hasStaleData && signalCount > 0) negative.push('Sinais severamente desatualizados');
  if (signalCount > 0 && signalCount < 3) negative.push('Poucos sinais recolhidos');
  if (!hasContext) negative.push('Sem ligação a apps externas de contexto');

  if (signalCount === 0) {
      return {
         level: 'insuficiente',
         label: 'Base Mínima Insuficiente',
         color: 'rgba(255,255,255,0.4)',
         rationale: 'Não existem dados fisiológicos para sustentar análises dedutivas seguras.',
         factors: { positive, negative: ['Ausência total de histórico biométrico', ...negative] },
         recommendedAction: { label: 'Iniciar Sincronização', intent: 'sync_now' }
      };
  }
  
  if (freshness.status === 'very_stale') {
      return {
         level: 'limitada',
         label: 'Leitura Obsoleta Limitada',
         color: '#FF6060',
         rationale: 'A base de sinais está severamente expirada. A interpretação servirá apenas para referencial antigo.',
         factors: { positive, negative },
         recommendedAction: { label: 'Sincronizar Novos Dados', intent: 'sync_now' }
      };
  }

  if (signalCount < 3) {
      return {
         level: 'limitada',
         label: 'Leitura Fisiológica Limitada',
         color: '#FFA500',
         rationale: 'O volume de sinais é baixo limitando a qualidade cruzada do motor semântico.',
         factors: { positive, negative },
         recommendedAction: { label: 'Completar Perfil Base', intent: 'complete_profile' }
      };
  }
  
  // They have some good data, now evaluate peak confidence
  if (hasFreshData && hasContext && signalCount >= 4) {
      return {
         level: 'robusta',
         label: 'Leitura Integral Robusta',
         color: '#00D4AA',
         rationale: 'Sustentada por sinais recentes abundantes fundidos perfeitamente ao contexto exportado.',
         factors: { positive, negative },
         recommendedAction: { label: 'Explorar Análise', intent: 'explore_analysis' }
      };
  }
  
  if (hasFreshData || hasStaleData) {
      if (hasContext) {
          return {
             level: 'contextual',
             label: 'Leitura Híbrida',
             color: '#00F2FF',
             rationale: 'As lacunas em sinais ou idade fisiológica são contrabalançadas pelo motor contextual contínuo external.',
             factors: { positive, negative },
             recommendedAction: { label: 'Atualizar Sinais Base', intent: 'sync_now' }
          };
      } else {
          return {
             level: 'limitada',
             label: 'Leitura Isolada',
             color: '#FFA500',
             rationale: 'A ausência de contexto de estilo de vida limita as inferências às medições clínicas cegas puras.',
             factors: { positive, negative },
             recommendedAction: { label: 'Atrair Contexto Externo', intent: 'open_context' }
          };
      }
  }

  // Fallback
  return {
      level: 'insuficiente',
      label: 'Qualidade Inconclusiva',
      color: 'rgba(255,255,255,0.4)',
      rationale: 'Base biológica e/ou de contexto está inacessível. Recomendada nova sincronização prévia.',
      factors: { positive, negative },
      recommendedAction: { label: 'Sincronizar Cargas', intent: 'sync_now' }
  };
};

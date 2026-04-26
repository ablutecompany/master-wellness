import { ContributionEvent, SessionSummary, AppState } from '../../store/types';
import { getRegistryEntry } from './registry';

/**
 * @file ingestion.ts
 * @description Lógica de ingestão governada de outputs das Mini-Apps.
 * Responsável por validar, deduplicar e resumir dados na memória longitudinal.
 */

/**
 * Processa um evento de contribuição e retorna o novo estado da memória longitudinal.
 */
export const processContributionEvent = (
  event: ContributionEvent,
  currentState: AppState
): { longitudinalMemory: Record<string, any>, isDuplicate: boolean, status: 'success' | 'blocked' | 'error', reason?: string } => {
  
  // 1. Deduplicação
  if (currentState.processedEventIds.includes(event.event_id)) {
    return { longitudinalMemory: currentState.longitudinalMemory, isDuplicate: true, status: 'blocked', reason: 'Duplicate event ID' };
  }

  // 2. Validação via Registry e Consentimento
  const registryEntry = getRegistryEntry(event.miniapp_id);
  if (!registryEntry) {
    return { longitudinalMemory: currentState.longitudinalMemory, isDuplicate: false, status: 'error', reason: `Mini-app ${event.miniapp_id} não registada.` };
  }

  // Verificação de Consentimento Real (Governação)
  const appPermissions = currentState.grantedPermissions[event.miniapp_id] || [];
  const hasConsent = appPermissions.some(p => (p as any).toLowerCase().includes('write') || (p as any).toLowerCase().includes('all'));
  
  if (registryEntry.requires_consents && !hasConsent) {
    return { longitudinalMemory: currentState.longitudinalMemory, isDuplicate: false, status: 'blocked', reason: 'Falta de consentimento (write scope).' };
  }

  // 2.5 Governação Utilizável (Step Shell 5)
  const appConfig = currentState.ecosystemConfig[event.miniapp_id] || { enabled: true, influenceDisabled: false };
  
  if (!appConfig.enabled) {
    return { longitudinalMemory: currentState.longitudinalMemory, isDuplicate: false, status: 'blocked', reason: 'Módulo desativado pelo utilizador.' };
  }

  if (appConfig.influenceDisabled) {
     return { longitudinalMemory: currentState.longitudinalMemory, isDuplicate: false, status: 'blocked', reason: 'Influência no perfil desativada.' };
  }

  // 3. Mapeamento de Domínio e Sumarização (Longitudinal Memory)
  const domain = registryEntry.domain;
  const newMemory = { ...currentState.longitudinalMemory };
  const domainSummary = newMemory[domain] || { 
    last_update: 0, 
    contributions_count: 0, 
    summary_data: {} 
  };

  // Lógica específica de sumarização por tipo de evento (Mock-First Governed)
  const summary_data = { ...domainSummary.summary_data };

  switch (event.event_type) {
    case 'meal_logged':
    case 'nutrition_update':
      summary_data.last_meal_at = event.recorded_at;
      summary_data.daily_calories = (summary_data.daily_calories || 0) + (event.payload.calories || 0);
      break;
    
    case 'sleep_update':
      summary_data.last_sleep_score = event.payload.score;
      summary_data.last_sleep_at = event.recorded_at;
      break;

    case 'symptom_logged':
      summary_data.active_symptoms = Array.from(new Set([...(summary_data.active_symptoms || []), ...(event.payload.symptoms || [])]));
      break;

    default:
      // Ingestão genérica (apenas metadados se o tipo não for reconhecido)
      summary_data.last_generic_event = event.event_type;
  }

  newMemory[domain] = {
    last_update: Date.now(),
    contributions_count: domainSummary.contributions_count + 1,
    origin_mode: (event.payload.origin_mode as any) || 'real', // Assume real se não especificado
    contribution_type: event.event_type.includes('logged') ? 'action' : 'sensor', // Heurística simples
    summary_data
  };

  return { longitudinalMemory: newMemory, isDuplicate: false, status: 'success' };
};

/**
 * Processa um sumário de sessão.
 */
export const processSessionSummary = (
  summary: SessionSummary,
  currentState: AppState
): { longitudinalMemory: Record<string, any>, status: 'success' | 'blocked' | 'error', reason?: string } => {
  const newMemory = { ...currentState.longitudinalMemory };
  const appEntry = summary.miniapp_id ? getRegistryEntry(summary.miniapp_id) : null;
  
  if (summary.miniapp_id) {
    const appConfig = currentState.ecosystemConfig[summary.miniapp_id] || { enabled: true, influenceDisabled: false };
    if (!appConfig.enabled || appConfig.influenceDisabled) {
      return { longitudinalMemory: currentState.longitudinalMemory, status: 'blocked', reason: 'Governação: Módulo ou Influência desativados.' };
    }
  }

  const domain = appEntry?.domain || 'system';

  const domainSummary = newMemory[domain] || { last_update: 0, sessions_count: 0, total_credits_spent: 0 };

  newMemory[domain] = {
    ...domainSummary,
    last_update: Date.now(),
    sessions_count: (domainSummary.sessions_count || 0) + 1,
    total_credits_spent: (domainSummary.total_credits_spent || 0) + summary.consumed_credits,
    last_session_outcome: summary.outcome_status
  };

  return { longitudinalMemory: newMemory, status: 'success' };
};

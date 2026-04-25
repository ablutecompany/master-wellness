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
): { longitudinalMemory: Record<string, any>, isDuplicate: boolean } => {
  
  // 1. Deduplicação
  if (currentState.processedEventIds.includes(event.event_id)) {
    return { longitudinalMemory: currentState.longitudinalMemory, isDuplicate: true };
  }

  // 2. Validação via Registry e Consentimento
  const registryEntry = getRegistryEntry(event.miniapp_id);
  if (!registryEntry) {
    console.warn(`[Ingestion] Evento rejeitado: Mini-app ${event.miniapp_id} não registada.`);
    return { longitudinalMemory: currentState.longitudinalMemory, isDuplicate: false };
  }

  // Verificação de Consentimento Real (Governação)
  const appPermissions = currentState.grantedPermissions[event.miniapp_id] || [];
  const hasConsent = appPermissions.some(p => p.toLowerCase().includes('write') || p.toLowerCase().includes('all'));
  
  if (registryEntry.requires_consents && !hasConsent) {
    console.warn(`[Ingestion] Bloqueio de Segurança: App ${event.miniapp_id} tentou escrever sem consentimento.`);
    return { longitudinalMemory: currentState.longitudinalMemory, isDuplicate: false };
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
    summary_data
  };

  return { longitudinalMemory: newMemory, isDuplicate: false };
};

/**
 * Processa um sumário de sessão.
 */
export const processSessionSummary = (
  summary: SessionSummary,
  currentState: AppState
): Record<string, any> => {
  const newMemory = { ...currentState.longitudinalMemory };
  const appEntry = summary.miniapp_id ? getRegistryEntry(summary.miniapp_id) : null;
  const domain = appEntry?.domain || 'system';

  const domainSummary = newMemory[domain] || { last_update: 0, sessions_count: 0, total_credits_spent: 0 };

  newMemory[domain] = {
    ...domainSummary,
    last_update: Date.now(),
    sessions_count: (domainSummary.sessions_count || 0) + 1,
    total_credits_spent: (domainSummary.total_credits_spent || 0) + summary.consumed_credits,
    last_session_outcome: summary.outcome_status
  };

  return newMemory;
};

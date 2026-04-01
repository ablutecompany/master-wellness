import { AppState, ContextFact } from '../../store/types';
import { AppContributionEvent, ContributionEventType } from '../../miniapps/types';

const TTL_MAP: Partial<Record<ContributionEventType, number>> = {
  preference_changed: Infinity,
  ingredient_disliked: Infinity,
  sleep_pattern_changed: Infinity, // Alteração de padrão é estrutural
  sleep_debt_detected: 48 * 60 * 60 * 1000, // 48h
  fatigue_context_added: 24 * 60 * 60 * 1000, // 24h
  context_note_added: 7 * 24 * 60 * 60 * 1000, // 7 dias
  meal_accepted: 24 * 60 * 60 * 1000, // 24h (sinal diário)
  meal_rejected: 24 * 60 * 60 * 1000,
};

const DOMAIN_MAP: Record<ContributionEventType, ContextFact['domain']> = {
  preference_changed: 'general',
  context_note_added: 'general',
  meal_accepted: 'nutrition',
  meal_rejected: 'nutrition',
  ingredient_disliked: 'nutrition',
  sleep_pattern_changed: 'sleep',
  sleep_debt_detected: 'sleep',
  fatigue_context_added: 'general',
};

/**
 * Normaliza um evento bruto de contribuição num Facto de Contexto longitudinal.
 */
export function normalizeEvent(event: AppContributionEvent): ContextFact {
  const ttl = TTL_MAP[event.eventType] || 24 * 60 * 60 * 1000; // Default 24h
  const domain = DOMAIN_MAP[event.eventType] || 'general';

  return {
    id: `fact_${event.eventId}`,
    domain,
    type: event.eventType,
    value: event.payload,
    sourceAppId: event.sourceAppId,
    derivedFromEventIds: [event.eventId],
    createdAt: event.receivedAt || Date.now(),
    validFrom: event.recordedAt,
    validUntil: ttl === Infinity ? Infinity : event.recordedAt + ttl,
    status: 'active',
    confidence: event.confidence || 0.8,
    provenance: {
      appVersion: event.eventVersion,
      contextVersion: event.contextVersion
    }
  };
}

/**
 * Filtra factos baseados em frescura/validade temporal.
 */
export function filterActiveFacts(facts: ContextFact[], now: number = Date.now()): ContextFact[] {
  return facts.filter(f => {
    if (f.validUntil === Infinity) return true;
    return f.validUntil > now;
  });
}

/**
 * Agrupa factos por domínio.
 */
export function groupFactsByDomain(facts: ContextFact[]): Record<string, ContextFact[]> {
  return facts.reduce((acc, fact) => {
    if (!acc[fact.domain]) acc[fact.domain] = [];
    acc[fact.domain].push(fact);
    return acc;
  }, {} as Record<string, ContextFact[]>);
}

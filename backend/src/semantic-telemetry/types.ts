export type SemanticTelemetryEventType = 
  | 'semantic_bundle_received'
  | 'semantic_card_viewed'
  | 'insight_displayed'
  | 'recommendation_displayed'
  | 'recommendation_suppressed'
  | 'insufficient_data_state_displayed'
  | 'unavailable_state_displayed';

export interface SemanticTelemetryEvent {
  eventType: SemanticTelemetryEventType;
  domain: string;
  bundleVersion: string;
  semanticVersion: string;
  screen: 'home' | 'themes' | 'analyses';
  cardId?: string;
  themeId?: string;
  status: 'sufficient_data' | 'insufficient_data' | 'unavailable';
  insightIds: string[];
  recommendationIds: string[];
  suppressedRecommendationIds?: string[];
  suppressionReason?: string;
  evidenceRefIds: string[];
  timestamp: number;
  sessionId: string;
  source: 'shell' | 'miniapp';
  fingerprint: string; // Used for deterministic deduplication
}

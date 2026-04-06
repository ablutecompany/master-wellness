export type SemanticTelemetryEventType = 
  | 'semantic_bundle_received'
  | 'semantic_card_viewed'
  | 'insight_displayed'
  | 'insight_interaction'
  | 'recommendation_displayed'
  | 'recommendation_suppressed'
  | 'recommendation_not_rendered_ui_limit'
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
}

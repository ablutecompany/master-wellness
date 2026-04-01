/**
 * Domain Engine Types
 * Unified contract for deterministic scoring, insights and recommendations.
 */

export type DomainType = 'sleep' | 'nutrition' | 'general' | 'recovery' | 'energy' | 'performance';
export type ExposurePolicy = 'allowed' | 'denied' | 'unavailable';
export type DomainStatus = 'sufficient_data' | 'insufficient_data' | 'unavailable';

export interface DomainScore {
  value: number;
  confidence: number;
  status: DomainStatus;
  stateLabel: string; // e.g. "excelente", "moderado"
  band: 'functional' | 'optimal' | 'critical';
  freshnessPenalty: number;
  completenessPenalty: number;
}

export interface DomainInsight {
  id: string;
  summary: string;
  explanation: string;
  factors: Record<string, any>;
  evidenceRefs: string[]; // IDs of measurements/facts used
  version: string;
  tone: 'clinical-light' | 'motivational';
}

export interface RecommendationItem {
  id: string;
  type: string;
  title: string;
  bodyShort: string;
  bodyLong: string;
  priorityRank: number;
  effortLevel: 'low' | 'medium' | 'high';
  impactLevel: 'low' | 'medium' | 'high';
}

export interface DomainSemanticOutput {
  domain: DomainType;
  version: string;
  status: DomainStatus;
  generatedAt: number;
  score: DomainScore;
  insights: DomainInsight[];
  recommendations: RecommendationItem[];
  inputSummary: {
    signalsCount: number;
    lastSignalAt: number | null;
    trace: string[]; // Audit trace of what was analyzed
  };
  evidenceRefs: string[];
}

export interface DomainSemanticBundle {
  bundleVersion: string;
  generatedAt: number;
  userId: string;
  domains: Record<DomainType, DomainSemanticOutput>;
  coherenceFlags: string[];
}

export interface ScoringConfig {
  weights: Record<string, number>;
  thresholds: {
    optimal: number;
    functional: number;
  };
}

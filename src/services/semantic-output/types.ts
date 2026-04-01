/**
 * Frontend types for the Backend Semantic Output Contract.
 * Mirrors backend/src/domain-engine/types.ts
 */

export type DomainType = 'sleep' | 'nutrition' | 'general' | 'recovery' | 'energy' | 'performance';
export type DomainStatus = 'sufficient_data' | 'insufficient_data' | 'unavailable';

export interface DomainScore {
  value: number;
  confidence: number;
  status: DomainStatus;
  stateLabel: string;
  band: 'functional' | 'optimal' | 'critical';
}

export interface DomainInsight {
  id: string;
  summary: string;
  explanation: string;
  factors: Record<string, any>;
  evidenceRefs: string[];
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

export interface DomainOutput {
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
    trace: string[];
  };
}

export interface SemanticBundle {
  bundleVersion: string;
  generatedAt: number;
  domains: Record<string, DomainOutput>;
  coherenceFlags: string[];
}

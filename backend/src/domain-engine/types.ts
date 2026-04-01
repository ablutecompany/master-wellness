/**
 * SEMANTIC DOMAIN ENGINE v1.2.0 - Core Types
 * Deterministic Health Narratives - Stale Logic
 */

export type DomainType = 'sleep' | 'nutrition' | 'general' | 'energy' | 'recovery' | 'performance'; // Restrito conforme solicitado

export type DomainStatus = 
  | 'sufficient_data' 
  | 'insufficient_data' 
  | 'unavailable' 
  | 'stale';

export interface EvidenceRef {
  biomarkerCode: string;
  value: number;
  unit: string;
  capturedAt: Date;
  state: 'optimal' | 'borderline' | 'critical';
}

export interface DomainInsight {
  id: string;
  summary: string;
  explanation: string;
  tone: 'informative' | 'supportive' | 'alert';
  factors: string[];
  version: string;
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

export interface DomainScore {
  value: number; 
  stateLabel: string; 
  band: 'optimal' | 'fair' | 'poor';
  confidence: number; 
  freshnessPenalty: number;
  completenessPenalty: number;
  status: DomainStatus;
}

export interface DomainSemanticOutput {
  domain: DomainType;
  version: string;
  generatedAt: number;
  lastComputedAt: number; // NOVO: Auditoria Biográfica
  isStale: boolean;       // NOVO: Sinalizador de Revalidação Pendente
  score: DomainScore;
  insights: DomainInsight[];
  recommendations: RecommendationItem[];
  evidence: EvidenceRef[];
  trace: string[]; 
}

export interface DomainAuditTrace {
  requestedDomains: string[];
  processedDomains: string[];
  engineVersion: string;
  timestamp: number;
}

export interface CrossDomainCoherence {
  summary: string;
  coherenceFlags: string[];
  prioritySignals: string[];
  deduplicatedRecommendations: RecommendationItem[];
}

export interface DomainSemanticBundle {
  bundleVersion: string;
  generatedAt: number;
  userId: string;
  domains: Record<string, DomainSemanticOutput>;
  coherenceFlags: string[];
  crossDomainSummary?: CrossDomainCoherence;
  auditTrace: DomainAuditTrace; // NOVO
}

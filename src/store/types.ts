export * from './state-types';

export interface DomainPackage {
  domain: 'sleep' | 'nutrition' | 'general' | 'female-health';
  packageVersion: string; // e.g. "1.0"
  generatedAt: number;
  facts: ContextFact[];
  signals: {
    score?: number;
    statusLabel?: string;
    trend?: 'improving' | 'declining' | 'stable';
  };
  provenanceSummary: {
    sourceAppIds: string[];
    lastUpdated: number;
  };
  exposurePolicy: 'allowed' | 'denied' | 'unavailable';
}

export interface ContextFact {
  id: string;
  domain: 'nutrition' | 'sleep' | 'mental' | 'fitness' | 'longevity' | 'female-health' | 'general';
  type: ContributionEventType;
  value: any;
  sourceAppId: string;
  derivedFromEventIds: string[];
  createdAt: number;
  validFrom: number;
  validUntil: number; // TTL / Expiration
  status: 'active' | 'expired' | 'superseded';
  confidence: number;
  provenance: {
    appVersion?: string;
    contextVersion?: string;
    bridgeVersion?: string;
  };
}


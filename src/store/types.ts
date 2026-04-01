import { MiniAppManifest, Permission, MiniAppEvent, AppContributionEvent, ContributionEventType } from '../miniapps/types';

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

export interface UserProfile {
  name: string;
  goals: string[];
  habits?: string[];
  age?: number;
  weight?: number;
  height?: number;
}

export interface Measurement {
  id: string;
  type: 'urinalysis' | 'ecg' | 'ppg' | 'weight' | 'temp';
  value: any;
  timestamp: number;
}

export interface ThemeScore {
  id: string;
  themeCode: string;
  value: number;
  stateLabel: string;
  insight?: {
    summaryShort: string;
    explanationLong: string;
  };
  recommendations?: any[];
}

export interface AppState {
  // ── Core ──────────────────────────────────────────────────────────────────
  user: UserProfile | null;
  measurements: Measurement[];
  themeScores: ThemeScore[];
  globalScore: number;
  isNfcLoading: boolean;
  isMeasuring: boolean;
  credits: number;
  appEvents: MiniAppEvent[];
  appContributionEvents: AppContributionEvent[];

  // ── Mini-App Shell ────────────────────────────────────────────────────────
  installedAppIds: string[];
  activeApp: MiniAppManifest | null;
  grantedPermissions: Record<string, Permission[]>;

  // ── Core Actions ──────────────────────────────────────────────────────────
  setUser: (user: UserProfile) => void;
  addMeasurement: (measurement: Measurement) => void;
  setThemeScores: (scores: ThemeScore[]) => void;
  setGlobalScore: (score: number) => void;
  setNfcLoading: (loading: boolean) => void;
  setIsMeasuring: (measuring: boolean) => void;
  setCredits: (credits: number) => void;
  recordAppEvent: (event: MiniAppEvent) => void;
  addAppContributionEvent: (event: AppContributionEvent) => void;

  // ── Mini-App Actions ──────────────────────────────────────────────────────
  installApp: (id: string) => void;
  uninstallApp: (id: string) => void;
  launchApp: (app: MiniAppManifest) => void;
  closeApp: () => void;
  grantPermissions: (appId: string, perms: Permission[]) => void;
  isAppInstalled: (id: string) => boolean;
  hasGrantedPermissions: (id: string) => boolean;
}

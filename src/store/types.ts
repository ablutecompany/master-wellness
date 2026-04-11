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
  activeAnalysisId?: string;
}

export interface Measurement {
  id: string;
  type: 'urinalysis' | 'ecg' | 'ppg' | 'weight' | 'temp';
  value: any;
  timestamp: number;
}

// ── Análise unificada ─────────────────────────────────────────────────────────
// Um Analysis é uma sessão de dados completa: medições + sinais de ecossistema.
// É a ÚNICA fonte de verdade para Resultados e Leitura AI.
export interface AnalysisMeasurement {
  id: string;
  type: 'urinalysis' | 'ecg' | 'ppg' | 'temp' | 'weight' | 'fecal';
  marker?: string;    // para urinalysis e fecal
  value: string;      // valor legível
  unit: string;
  recordedAt: string; // ISO timestamp
}

export interface AnalysisEvent {
  id: string;
  type: string;         // ex: 'sleep_duration_logged'
  value: string;        // ex: '7h 12m'
  sourceAppId: string;
  recordedAt: string;
}

export interface Analysis {
  id: string;
  label?: string;
  analysisDate: string;  // 'YYYY-MM-DD' — data da recolha
  source: 'device' | 'manual' | 'demo';
  demoScenarioKey?: string;
  measurements: AnalysisMeasurement[];
  ecosystemFacts: AnalysisEvent[];
  createdAt: string;
}

export interface AppState {
  // ── Core ──────────────────────────────────────────────────────────────────
  user: UserProfile | null;          // Perfil da conta Autenticada
  guestProfile: UserProfile | null;   // Perfil do modo Guest (Persistido)
  isGuestMode: boolean;               // Flag de navegação local (Persistida)
  measurements: Measurement[];       // medições raw do dispositivo (legado)
  analyses: Analysis[];              // análises estruturadas (fonte de verdade)
  activeAnalysisId: string | null;   // qual a análise activa no painel
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
  setUser: (user: UserProfile | null) => void;
  setGuestMode: (isGuest: boolean) => void;
  updateGuestProfile: (profile: Partial<UserProfile>) => void;
  addMeasurement: (measurement: Measurement) => void;
  addAnalysis: (analysis: Analysis) => void;
  removeAnalysis: (id: string) => void;
  setAnalyses: (analyses: Analysis[]) => void;
  setActiveAnalysisId: (id: string | null) => void;
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

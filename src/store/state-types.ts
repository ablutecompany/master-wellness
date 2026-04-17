import { MiniAppManifest, Permission, MiniAppEvent, AppContributionEvent, ContributionEventType } from '../miniapps/types';

export interface UserProfile {
  name: string;
  goals: string[];
  habits?: string[];
  age?: number;
  weight?: number;
  height?: number;
  activeAnalysisId?: string;
}

export type ProfileStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'missing';

export interface Measurement {
  id: string;
  type: 'urinalysis' | 'ecg' | 'ppg' | 'weight' | 'temp';
  value: any;
  timestamp: number;
}

export interface AnalysisMeasurement {
  id: string;
  type: 'urinalysis' | 'ecg' | 'ppg' | 'temp' | 'weight' | 'fecal';
  marker?: string;
  value: string;
  unit: string;
  recordedAt: string;
}

export interface AnalysisEvent {
  id: string;
  type: string;
  value: string;
  sourceAppId: string;
  recordedAt: string;
}

export interface Analysis {
  id: string;
  label?: string;
  analysisDate: string;
  source: 'device' | 'manual' | 'demo';
  demoScenarioKey?: string;
  measurements: AnalysisMeasurement[];
  ecosystemFacts: AnalysisEvent[];
  createdAt: string;
}

export interface AppState {
  user: UserProfile | null;
  authAccount: any | null;
  profileStatus: ProfileStatus;
  guestProfile: UserProfile | null;
  isGuestMode: boolean;
  measurements: Measurement[];
  analyses: Analysis[];
  activeAnalysisId: string | null;
  isNfcLoading: boolean;
  isMeasuring: boolean;
  credits: number;
  appEvents: MiniAppEvent[];
  appContributionEvents: AppContributionEvent[];
  hasHydrated: boolean;
  installedAppIds: string[];
  activeApp: MiniAppManifest | null;
  grantedPermissions: Record<string, Permission[]>;
  demoAnalysis: Analysis | null;
  setUser: (user: UserProfile | null) => void;
  setAuthAccount: (account: any | null) => void;
  setProfileStatus: (status: ProfileStatus) => void;
  setGuestMode: (isGuest: boolean) => void;
  updateGuestProfile: (profile: Partial<UserProfile>) => void;
  setDemoAnalysis: (analysis: Analysis | null) => void;
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
  installApp: (id: string) => void;
  uninstallApp: (id: string) => void;
  launchApp: (app: MiniAppManifest) => void;
  closeApp: () => void;
  grantPermissions: (appId: string, perms: Permission[]) => void;
  isAppInstalled: (id: string) => boolean;
  hasGrantedPermissions: (id: string) => boolean;
  clearSensitiveState: () => void;
  setHasHydrated: (val: boolean) => void;
}

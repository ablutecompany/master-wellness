import { MiniAppManifest, Permission, MiniAppEvent, AppContributionEvent, ContributionEventType } from '../miniapps/types';

export interface UserProfile {
  id: string; // The canonical ID of this specific profile
  name: string;
  habits?: string[];
  age?: number;
  weight?: SourcedMetric<number>;
  height?: number;
  dateOfBirth?: string;
  sex?: 'M' | 'F';
  timezone?: string;
  country?: string;
  activeAnalysisId?: string;
}

export interface SourcedMetric<T = number> {
  value: T | null;
  source: 'measured' | 'manual' | 'derived' | 'missing';
  manualValue: T | null;
  measuredValue: T | null;
  isDiscrepant: boolean;
}
export type ProfileStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'missing';

export type ContextCategory = 'domain_goals' | 'physiological' | 'behavioral' | 'temporary_session' | 'persistent_preference';

export interface AppExportedContext {
  id: string;             // unique identifier (e.g. miniappId_domain_key)
  memberId: string;       // Strict boundary: context belongs to a specific member
  appId: string;          // the source mini-app that generated it
  category: ContextCategory;
  key: string;            // unique key for the app space (e.g. "cycle_phase")
  value: any;             // serialized context payload 
  isPersistent: boolean;  // false -> memory only for session; true -> saved to DB/LocalStorage
  updatedAt: string;
  expiresAt?: string;     // optional expiration timestamp for ephemeral states
}

export interface Measurement {
  id: string;
  memberId: string; // Ownership
  type: 'urinalysis' | 'ecg' | 'ppg' | 'weight' | 'temp';
  value: any;
  timestamp: number;
}

export interface AnalysisMeasurement {
  id: string;
  memberId?: string; // Strict ownership mapping
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
  memberId: string; // Strict ownership
  label?: string;
  analysisDate: string;
  source: 'device' | 'manual' | 'demo';
  demoScenarioKey?: string;
  measurements: AnalysisMeasurement[];
  ecosystemFacts: AnalysisEvent[];
  createdAt: string;
}

export type HouseholdRole = 'owner' | 'admin' | 'member' | 'dependent';
export type VisibilityLevel = 'private' | 'shared_household' | 'shared_selective';

export interface MemberPermissions {
  results: VisibilityLevel;
  context: VisibilityLevel;
}

export interface HouseholdMember {
  id: string;
  userId?: string; // if a registered user
  role: HouseholdRole;
  profile: UserProfile; 
  permissions: MemberPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface Household {
  id: string;
  rootMemberId: string;
  invitations?: any[];
  members: HouseholdMember[];
  createdAt: string;
}

export interface AppState {
  user: UserProfile | null;
  authAccount: any | null;
  profileStatus: ProfileStatus;
  guestProfile: UserProfile | null;
  isGuestMode: boolean;
  sessionToken?: string | null;
  
  // Household boundary
  household: Household | null;
  activeMemberId: string | null;  // Defines whose context/measurements are being shown

  exportedContexts: AppExportedContext[];
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
  updateAuthenticatedProfile: (updates: Partial<UserProfile>) => Promise<boolean>;

  setHousehold: (household: Household | null) => void;
  setActiveMember: (memberId: string | null) => void;

  setExportedContext: (context: AppExportedContext) => void;
  clearExportedContext: (id: string) => void;
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

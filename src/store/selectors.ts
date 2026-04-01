import { AppState, ContextFact, DomainPackage } from './types';
import { normalizeEvent, filterActiveFacts } from '../services/contributions-normalizer';
import { buildDomainPackage } from '../services/domain-packages';

/**
 * Camada de Selectors (Adapters de Leitura)
 * Objetivo: Desacoplar os componentes da estrutura interna do store.
 */

// ─────────────────────────────────────────────────────────────────────────────
// A) Profile Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectUser = (state: AppState) => state.user;
export const selectUserName = (state: AppState) => state.user?.name || 'Utilizadora';
export const selectCredits = (state: AppState) => state.credits ?? 0;

// ─────────────────────────────────────────────────────────────────────────────
// B) Measurement Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectMeasurements = (state: AppState) => state.measurements || [];
export const selectHasMeasurements = (state: AppState) => (state.measurements?.length || 0) > 0;
export const selectLatestMeasurements = (state: AppState, limit = 5) => 
  (state.measurements || []).slice(0, limit);
export const selectMeasurementsCount = (state: AppState) => (state.measurements || []).length;
export const selectMeasurementsByType = (state: AppState, type: string) => 
  (state.measurements || []).filter(m => m.type === type);

export const selectLatestMeasurement = (state: AppState) => (state.measurements || [])[0];

export const selectDaysSinceLastMeasurement = (state: AppState) => {
  const measurements = state.measurements || [];
  if (measurements.length === 0) return 0;
  const latest = Math.max(...measurements.map(m => m.timestamp));
  const diff = Date.now() - latest;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// ─────────────────────────────────────────────────────────────────────────────
// C) Insight Selectors (DEPRECATED - Use SemanticOutput Bundle)
// ─────────────────────────────────────────────────────────────────────────────
// Fonte de verdade migrada para semanticOutputService.getBundle()
// Antigos seletores de themeScores e globalScore removidos.

// ─────────────────────────────────────────────────────────────────────────────
// D) App Runtime Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectInstalledAppIds = (state: AppState) => state.installedAppIds || [];
export const selectActiveApp = (state: AppState) => state.activeApp;
export const selectIsAppInstalled = (state: AppState, appId: string) => 
  (state.installedAppIds || []).includes(appId);

// ─────────────────────────────────────────────────────────────────────────────
// E) Permission Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectGrantedPermissions = (state: AppState) => state.grantedPermissions || {};
export const selectAppPermissions = (state: AppState, appId: string) => 
  (state.grantedPermissions || {})[appId] || [];

// ─────────────────────────────────────────────────────────────────────────────
// F) Mini-App Contribution Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectAppContributionEvents = (state: AppState) => state.appContributionEvents || [];
export const selectAppContributionsByApp = (state: AppState, appId: string) => 
  (state.appContributionEvents || []).filter(e => e.sourceAppId === appId);

// ─────────────────────────────────────────────────────────────────────────────
// G) UI Operational Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectIsNfcLoading = (state: AppState) => state.isNfcLoading;
export const selectIsMeasuring = (state: AppState) => state.isMeasuring;
// ─────────────────────────────────────────────────────────────────────────────
// H) Derived Context Selectors (Normalização Longitudinal)
// ─────────────────────────────────────────────────────────────────────────────
export const selectDerivedContextFacts = (state: AppState): ContextFact[] => 
  (state.appContributionEvents || []).map(normalizeEvent);

export const selectActiveDerivedContextFacts = (state: AppState): ContextFact[] => 
  filterActiveFacts(selectDerivedContextFacts(state));

export const selectActiveFactsByDomain = (state: AppState, domain: ContextFact['domain']): ContextFact[] => 
  selectActiveDerivedContextFacts(state).filter(f => f.domain === domain);

// ─────────────────────────────────────────────────────────────────────────────
// I) Domain Package Selectors (Governed Exposure)
// ─────────────────────────────────────────────────────────────────────────────
export const selectSleepDomainPackage = (state: AppState, permissions: any[]): DomainPackage => 
  buildDomainPackage('sleep', state, permissions);

export const selectNutritionDomainPackage = (state: AppState, permissions: any[]): DomainPackage => 
  buildDomainPackage('nutrition', state, permissions);

export const selectGeneralWellnessPackage = (state: AppState, permissions: any[]): DomainPackage => 
  buildDomainPackage('general', state, permissions);

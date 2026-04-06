import { Permission } from '../../miniapps/types';
import { AppState, DomainPackage } from '../../store/types';
import * as Selectors from '../../store/selectors';
import * as DomainSelectors from '../../store/domainSelectors';

import { MINI_APP_CATALOG } from '../../miniapps/catalog';
import { semanticOutputService } from '../semantic-output';

export interface ContextState {
  user: any;
  measurements: any[];
  themeScores: any[];
  globalScore: number;
  grantedPermissions: Record<string, Permission[]>;
  domainPackages?: DomainPackage[];
}

// ───────────────────────────────────────────────
// V1.6.0: Modelo de Observabilidade da Bridge
// ───────────────────────────────────────────────

export type DecisionReasonCode = 
  | 'PACKAGE_ALLOWED'
  | 'DOMAIN_NOT_DECLARED'
  | 'PERMISSION_DENIED'
  | 'PACKAGE_UNAVAILABLE'
  | 'PACKAGE_VERSION_UNSUPPORTED'
  | 'STALE_BLOCKED_BY_POLICY'
  | 'CROSS_DOMAIN_NOT_SUPPORTED';

export interface PackageDecision {
  domain: string;
  policyApplied: string | null;
  reasonCode: DecisionReasonCode;
  timestamp: number;
}

export interface CrossDomainDecision {
  included: boolean;
  reasonCode: DecisionReasonCode;
}

export interface BridgeDecisionLog {
  appId: string;
  generatedAt: number;
  packageDecisions: PackageDecision[];
  crossDomain: CrossDomainDecision;
}

const _lastBridgeDecisions: Record<string, BridgeDecisionLog> = {};

export function getLastAuditLog(appId: string): BridgeDecisionLog | undefined {
  return _lastBridgeDecisions[appId];
}

export function buildContextPayload(appId: string, state: AppState) {
  // Lista de permissões efetivamente ativas e concedidas
  const perms = Selectors.selectAppPermissions(state, appId);
  
  const user = Selectors.selectUser(state);
  const measurements = Selectors.selectMeasurements(state);
  
  // Resíduos antigos marcados inequivocamente como não mantidos, 
  // para não quebrar parsing mas evitar que a app confie num "0".
  const themeScoresUndefined: any = undefined;
  const globalScoreUndefined: any = undefined;

  // 1. profileContext
  // Exibido apenas se autorizado através da flag PROFILE_READ
  const profileContext = perms.includes('PROFILE_READ')
    ? {
        name: user?.name || null,
        goals: user?.goals || [],
        habits: user?.habits || [],
      }
    : null;

  // 2. healthSummaryContext
  // Retirados themeScores e globalScore. Devolvemos undefined para causar fallback natural na mini-app
  // caso a mesma tente ler estas chaves defuntas.
  const healthSummaryContext = perms.includes('HEALTH_DATA_READ')
    ? {
        globalScore: globalScoreUndefined,
        themeScores: themeScoresUndefined,
        recentMeasurementsCount: measurements.length,
        status: 'legacy_metrics_unsupported',
      }
    : null;

  // 3. sleepContextPackage
  const sleepContextPackage = perms.includes('SLEEP_DATA_READ')
    ? {
        sleepScore: undefined, // legado
        // Adaptamos o histórico que existe filtrando para evitar exfiltrações
        relatedMeasurements: measurements
          .filter(m => m.type === 'urinalysis' || m.type === 'ppg')
          .slice(0, 5)
      }
    : null;

  // 4. nutritionContextPackage
  const nutritionContextPackage = perms.includes('NUTRITION_DATA_READ')
    ? {
        nutritionScore: undefined, // legado
        // Limita a partilha estritamente ao tipo pertinente
        lastMetabolicLogs: measurements
          .filter(m => m.type === 'weight')
          .slice(0, 3)
      }
    : null;

  // 5. permissionsContext
  // Lista auditável de direitos efetivamente injetados para introspeção da app
  const permissionsContext = {
    granted: perms,
    timestamp: Date.now(),
    version: '1.1'
  };

  // 7. domainPackages
  // Contrato principal de partilha: packages formalizados e versionados
  const manifest = MINI_APP_CATALOG.find(app => app.id === appId);

  // V1.6: Inicialização da Auditoria
  const auditLog: BridgeDecisionLog = {
    appId,
    generatedAt: Date.now(),
    packageDecisions: [],
    crossDomain: { included: false, reasonCode: 'CROSS_DOMAIN_NOT_SUPPORTED' }
  };

  let crossDomainSummary: any = undefined;
  if (manifest?.supportsCrossDomainSummary) {
    crossDomainSummary = semanticOutputService.getCrossDomainSummary();
    auditLog.crossDomain = { included: true, reasonCode: 'PACKAGE_ALLOWED' };
  } else {
    auditLog.crossDomain = { included: false, reasonCode: 'CROSS_DOMAIN_NOT_SUPPORTED' };
  }

  const STALE_THRESHOLD = 86400000; // 24 horas

  const rawPackages = [
    DomainSelectors.selectSleepDomainPackage(state, perms),
    DomainSelectors.selectNutritionDomainPackage(state, perms),
    DomainSelectors.selectGeneralWellnessPackage(state, perms),
  ];


  const domainPackages = rawPackages
    .map((pkg) => {
      // Registo Auditável Base
      if (pkg.exposurePolicy === 'denied') {
        auditLog.packageDecisions.push({ domain: pkg.domain, policyApplied: 'denied', reasonCode: 'PERMISSION_DENIED', timestamp: Date.now() });
        return pkg; // A pipeline filter lidará com a exclusão final a seguir
      }

      // Enforcement de Domínio Deklarado no Manifesto
      if (manifest?.consumedDomains && !manifest.consumedDomains.includes(pkg.domain)) {
        auditLog.packageDecisions.push({ domain: pkg.domain, policyApplied: null, reasonCode: 'DOMAIN_NOT_DECLARED', timestamp: Date.now() });
        return null; // App não declarou consumo, retemos na bridge.
      }

      // Enforcement de Versão Suportada
      if (manifest?.supportedPackageVersions && !manifest.supportedPackageVersions.includes(pkg.packageVersion)) {
        auditLog.packageDecisions.push({ domain: pkg.domain, policyApplied: 'unavailable', reasonCode: 'PACKAGE_VERSION_UNSUPPORTED', timestamp: Date.now() });
        return {
          ...pkg,
          exposurePolicy: 'unavailable', // Incompatibilidade de versão despromove silently a "sem dados"
          facts: [],
          signals: null,
          packageVersion: pkg.packageVersion,
        };
      }

      // Enforcement de Frescura (requiresFreshData)
      if (manifest?.requiresFreshData && pkg.generatedAt && (Date.now() - pkg.generatedAt > STALE_THRESHOLD)) {
        auditLog.packageDecisions.push({ domain: pkg.domain, policyApplied: 'stale_blocked', reasonCode: 'STALE_BLOCKED_BY_POLICY', timestamp: Date.now() });
        return {
          ...pkg,
          exposurePolicy: 'stale_blocked',
          facts: [],
          signals: null,
        };
      }

      if (pkg.exposurePolicy === 'unavailable') {
        auditLog.packageDecisions.push({ domain: pkg.domain, policyApplied: 'unavailable', reasonCode: 'PACKAGE_UNAVAILABLE', timestamp: Date.now() });
      } else {
        auditLog.packageDecisions.push({ domain: pkg.domain, policyApplied: 'allowed', reasonCode: 'PACKAGE_ALLOWED', timestamp: Date.now() });
      }

      return pkg;
    })
    .filter((pkg) => pkg !== null && pkg.exposurePolicy !== 'denied') as DomainPackage[];

  // Finalizar rastreio de auditoria persistente global para QA/Debug
  _lastBridgeDecisions[appId] = auditLog;

  return {
    appId,
    contextVersion: '1.1-' + Date.now(), // Versionamento para reatividade
    profileContext,
    healthSummaryContext,
    sleepContextPackage,
    nutritionContextPackage,
    permissionsContext,
    domainPackages,
    crossDomainSummary
  };
}

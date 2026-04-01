import { AppState, DomainPackage, ContextFact } from '../../store/types';
import * as Selectors from '../../store/selectors';
import { Permission } from '../../miniapps/types';

/**
 * Construtor determinístico de Domain Packages.
 * Agrega Factos, Scores e Metadados para consumo seguro por mini-apps.
 */
export function buildDomainPackage(
  domain: DomainPackage['domain'], 
  state: AppState, 
  permissions: Permission[]
): DomainPackage {
  // 1. Determinar política de exposição baseada em permissões
  const hasPermission = checkPermissionForDomain(domain, permissions);
  const facts = Selectors.selectActiveFactsByDomain(state, domain as any);
  
  let exposurePolicy: DomainPackage['exposurePolicy'] = 'allowed';
  if (!hasPermission) {
    exposurePolicy = 'denied';
  } else if (facts.length === 0) {
    exposurePolicy = 'unavailable';
  }

  const themeScore = Selectors.selectThemeScores(state).find(ts => ts.themeCode === domain);
  const sourceAppIds = Array.from(new Set(facts.map(f => f.sourceAppId)));
  const lastUpdated = facts.length > 0 ? Math.max(...facts.map(f => f.createdAt)) : Date.now();

  return {
    domain,
    packageVersion: `${domain}@1.0`, // Versionamento explícito por domínio
    generatedAt: Date.now(),
    facts: hasPermission ? facts : [],
    signals: {
      score: themeScore?.value,
      statusLabel: themeScore?.stateLabel,
    },
    provenanceSummary: {
      sourceAppIds,
      lastUpdated
    },
    exposurePolicy
  };
}

function checkPermissionForDomain(domain: string, permissions: Permission[]): boolean {
  if (domain === 'sleep') return permissions.includes('SLEEP_DATA_READ');
  if (domain === 'nutrition') return permissions.includes('NUTRITION_DATA_READ');
  if (domain === 'female-health') return permissions.includes('CYCLE_DATA_READ');
  if (domain === 'general') return permissions.includes('PROFILE_READ');
  return false;
}

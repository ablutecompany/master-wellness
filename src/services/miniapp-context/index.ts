import { Permission } from '../../miniapps/types';
import { AppState, DomainPackage } from '../../store/types';
import * as Selectors from '../../store/selectors';

export interface ContextState {
  user: any;
  measurements: any[];
  themeScores: any[];
  globalScore: number;
  grantedPermissions: Record<string, Permission[]>;
  /** @deprecated use domainPackages instead */
  derivedContext?: any[];
  domainPackages?: DomainPackage[];
}

export function buildContextPayload(appId: string, state: AppState) {
  // Lista de permissões efetivamente ativas e concedidas
  const perms = Selectors.selectAppPermissions(state, appId);
  
  const user = Selectors.selectUser(state);
  const measurements = Selectors.selectMeasurements(state);
  const themeScores = Selectors.selectThemeScores(state);
  const globalScore = Selectors.selectGlobalScore(state);

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
  // Expõe a saúde agregada APENAS se autorizado em HEALTH_DATA_READ
  // Sem dump cego; isolando variáveis genéricas
  const healthSummaryContext = perms.includes('HEALTH_DATA_READ')
    ? {
        globalScore: globalScore,
        themeScores: themeScores.map(ts => ({
          themeCode: ts.themeCode,
          value: ts.value,
          stateLabel: ts.stateLabel
        })),
        recentMeasurementsCount: measurements.length,
      }
    : null;

  // 3. sleepContextPackage
  // Isolando leituras ou temas de sono para apps de sono (SLEEP_DATA_READ)
  const sleepContextPackage = perms.includes('SLEEP_DATA_READ')
    ? {
        sleepScore: themeScores.find(ts => ts.themeCode === 'sleep')?.value || null,
        // Adaptamos o histórico que existe filtrando para evitar exfiltrações
        relatedMeasurements: measurements
          .filter(m => m.type === 'urinalysis' || m.type === 'ppg')
          .slice(0, 5)
      }
    : null;

  // 4. nutritionContextPackage
  // Isolando dieta/metabolismo para nutrição (NUTRITION_DATA_READ)
  const nutritionContextPackage = perms.includes('NUTRITION_DATA_READ')
    ? {
        nutritionScore: themeScores.find(ts => ts.themeCode === 'nutrition')?.value || null,
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

  // 6. derivedContext
  // Expõe factos derivados (normalizados) pertinentes aos domínios autorizados
  const derivedContext = Selectors.selectActiveDerivedContextFacts(state)
    .filter(fact => {
      if (fact.domain === 'nutrition' && perms.includes('NUTRITION_DATA_READ')) return true;
      if (fact.domain === 'sleep' && perms.includes('SLEEP_DATA_READ')) return true;
      if (fact.domain === 'general' && perms.includes('PROFILE_READ')) return true;
      return false;
    });

  // 7. domainPackages
  // Contrato principal de partilha: packages formalizados e versionados
  const domainPackages = [
    Selectors.selectSleepDomainPackage(state, perms),
    Selectors.selectNutritionDomainPackage(state, perms),
    Selectors.selectGeneralWellnessPackage(state, perms),
  ].filter(pkg => pkg.exposurePolicy !== 'denied'); // Só expõe se houver permissão, mesmo que vazio (unavailable)

  return {
    appId,
    contextVersion: '1.1-' + Date.now(), // Versionamento para reatividade
    profileContext,
    healthSummaryContext,
    sleepContextPackage,
    nutritionContextPackage,
    permissionsContext,
    /** @deprecated use domainPackages instead. Remove in v2.0 */
    derivedContext,
    domainPackages
  };
}

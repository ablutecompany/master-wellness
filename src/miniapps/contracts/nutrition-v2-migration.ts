import { AbluteContext, getDomainPackage, getPackageStatus } from './domain-packages';

/**
 * Exemplo de Migração Real: NutriMenu (_Meal planner)
 * Este ficheiro demonstra como as apps de nutrição operam sob o contrato v1.2.
 */

export function onNutritionAppContextUpdate(context: AbluteContext) {
  // 1. Consumo via Domain Packages (Caminho Principal)
  const nutritionPkg = getDomainPackage(context, 'nutrition');
  
  if (!nutritionPkg) {
    console.error('Falha crítica: Acesso ao package de nutrição negado pela Shell.');
    // 1. Telemetria de consumo negado
    (window as any).ablute.emit('package_read', { 
    domain: 'nutrition', 
    version: 'unknown',
    policy: 'denied'
    });
    return;
  }

  // 2. Lógica baseada nos 3 estados de exposição
  const status = getPackageStatus(nutritionPkg);

  if (status.isAllowed) {
    // 3. Emitir Telemetria de Consumo Efetivo
    (window as any).ablute.emit('package_read', { 
      domain: 'nutrition', 
      version: nutritionPkg.packageVersion,
      policy: 'allowed'
    });

    const score = nutritionPkg.signals.score;
    const label = nutritionPkg.signals.statusLabel;
    
    console.log(`[Nutrition V2] Plano alimentar com Score Metabolic: ${score}% (${label})`);
    // updateMeals(nutritionPkg.facts);

  } else if (status.isDenied) {
     // 3. Emitir Telemetria (Acesso Negado pela Política)
     (window as any).ablute.emit('package_read', { 
       domain: 'nutrition', 
       version: nutritionPkg.packageVersion,
       policy: 'denied'
     });
     console.warn('[Nutrition V2] Acesso Negado: Redireccionando para ativação de permissões.');
     // triggerUI('NUTRITION_DENIED_SCREEN');

  } else if (status.isUnavailable) {
     // 3. Telemetria para ausência de dados
     (window as any).ablute.emit('package_read', { 
       domain: 'nutrition', 
       version: nutritionPkg.packageVersion,
       policy: 'unavailable'
     });
     console.info('[Nutrition V2] Sem Dados: Mostrando ecrã de histórico de refeições vazio.');
     // showEmptyNutritionOnboarding();
  }
}



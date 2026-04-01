import { AbluteContext, getDomainPackage, getPackageStatus } from './domain-packages';

/**
 * Exemplo de Migração Real: Sleep Deep v2
 * Este ficheiro demonstra como o código da mini-app transita para o novo contrato.
 */

export function onSleepAppContextUpdate(context: AbluteContext) {
  // 1. Consumir o novo contrato (domainPackages)
  const sleepPkg = getDomainPackage(context, 'sleep');
  
  if (!sleepPkg) {
    console.error('Falha crítica: Acesso ao package de sono negado pela Shell.');
    // 1. Telemetria de Falha Crítica (Acesso Negado no Nível Base)
    (window as any).ablute.emit('package_read', { 
      domain: 'sleep', 
      version: 'unknown',
      policy: 'denied'
    });
    return;
  }

  // 2. Lógica baseada nos 3 estados de exposição
  const status = getPackageStatus(sleepPkg);

  if (status.isAllowed) {
    // 3. Emitir Telemetria de Consumo Efetivo (Realizado no ponto de uso)
    (window as any).ablute.emit('package_read', { 
      domain: 'sleep', 
      version: sleepPkg.packageVersion,
      policy: 'allowed'
    });

    const score = sleepPkg.signals.score;
    const label = sleepPkg.signals.statusLabel;
    
    console.log(`[Sleep V2] Renderizando com Score: ${score}% (${label})`);
    // updateUI({ score, label, facts: sleepPkg.facts });

  } else if (status.isDenied) {
     // 3. Emitir Telemetria (Acesso Negado pela Política)
     (window as any).ablute.emit('package_read', { 
       domain: 'sleep', 
       version: sleepPkg.packageVersion,
       policy: 'denied'
     });
     console.warn('[Sleep V2] Acesso Negado: Redireccionando para pedido de permissão.');
     // triggerPermissionRequest();

  } else if (status.isUnavailable) {
     // 3. Emitir Telemetria de Consumo (Sem Dados)
     (window as any).ablute.emit('package_read', { 
       domain: 'sleep', 
       version: sleepPkg.packageVersion,
       policy: 'unavailable'
     });
     console.info('[Sleep V2] Sem Dados: Mostrando ecrã de onboarding de exame.');
     // showNoDataEmptyState();
  }

  // 4. Fallback Legado (Transitório e Secundário)
  // CONDIÇÕES PARA REMOÇÃO:
  // - Shell v1.2+ como standard mínimo e bridge v1.2+ em produção
  // - Domínio 'sleep' normalizado 100% via contributors-normalizer
  // - Todas as apps de sono migradas para v1.2.0
  // @sunset v2.0-core
  if (!sleepPkg && context.derivedContext) {
    console.warn('[Sleep Migration] Usando fallback legado de emergência: derivedContext.');
    // handleLegacyFlow(context.derivedContext);
  }
}

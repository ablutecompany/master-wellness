/**
 * Validation Helpers for Ablute Contracts
 * Estas funções afirmam o cumprimento do esquema da runtime e são usadas nas passagens de contrato e bridge.
 */

export function validateSemanticBundleShape(bundle: any): boolean {
  if (!bundle || typeof bundle !== 'object') return false;
  if (!['ready', 'stale', 'insufficient_data', 'error', 'unavailable'].includes(bundle.status)) return false;
  
  // Bloquear legados
  if ('globalScore' in bundle || 'themeScores' in bundle) return false;

  if (bundle.domains && typeof bundle.domains === 'object') {
    for (const [domainName, output] of Object.entries(bundle.domains)) {
      if (!output || typeof output !== 'object') return false;
      const o = output as any;
      if (!['ready', 'stale', 'insufficient_data', 'error', 'unavailable'].includes(o.status)) return false;
      
      // Se tiver isStale, tem de ser booleano
      if ('isStale' in o && typeof o.isStale !== 'boolean') return false;
    }
  }

  return true;
}

export function validateDomainPackageShape(pkg: any): boolean {
  if (!pkg || typeof pkg !== 'object') return false;
  
  if (typeof pkg.domain !== 'string') return false;
  if (typeof pkg.packageVersion !== 'string') return false;
  if (!['allowed', 'denied', 'unavailable'].includes(pkg.exposurePolicy)) return false;

  // Em modo 'allowed', o package tem de possuir signals e facts construíveis
  if (pkg.exposurePolicy === 'allowed') {
     if (!pkg.signals || typeof pkg.signals !== 'object') return false;
     if (!Array.isArray(pkg.facts)) return false;
  }

  // Prevenir que alguem adicione derivedContext solto
  if ('derivedContext' in pkg) return false;

  return true;
}

/**
 * Ablute Mini-App Bridge SDK (Client Side)
 * 
 * Este ficheiro representa o contrato que corre dentro da WebView da mini-app.
 */

export type ExposurePolicy = 'allowed' | 'denied' | 'unavailable';

export interface DomainPackage {
  domain: string;
  packageVersion: string;
  generatedAt: number;
  exposurePolicy: ExposurePolicy;
  signals: any;
  facts: any[];
  provenanceSummary: any;
}

export interface AbluteContext {
  appId: string;
  contextVersion: string;
  domainPackages: DomainPackage[];
  /** @deprecated use domainPackages instead */
  derivedContext?: any;
}

/**
 * Helper para obter um package específico com validação runtime.
 */
export function getDomainPackage(context: AbluteContext, domain: string): DomainPackage | null {
  if (!context || !Array.isArray(context.domainPackages)) {
    console.warn('[AbluteSDK] domainPackages não encontrado no contexto');
    return null;
  }

  const pkg = context.domainPackages.find(p => p.domain === domain);
  
  if (!pkg) {
    console.warn(`[AbluteSDK] Package for domain "${domain}" not found.`);
    return null;
  }

  // Validação Runtime Mínima (Harden)
  if (!pkg.packageVersion || !pkg.exposurePolicy) {
    console.error(`[AbluteSDK] Package for domain "${domain}" is malformed.`);
    return null;
  }

  return pkg;
}

/**
 * Interpreta o estado do package para lógica de UI.
 */
export function getPackageStatus(pkg: DomainPackage) {
  return {
    isAllowed: pkg.exposurePolicy === 'allowed',
    isDenied: pkg.exposurePolicy === 'denied',
    isUnavailable: pkg.exposurePolicy === 'unavailable',
    hasData: pkg.facts.length > 0 || (pkg.signals && Object.keys(pkg.signals).length > 0)
  };
}

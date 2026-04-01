/**
 * Ablute Mini-App Bridge SDK (Client Side)
 * 
 * Este ficheiro representa o contrato que corre dentro da WebView da mini-app.
 */

export type ExposurePolicy = 'allowed' | 'denied' | 'unavailable' | 'stale_blocked';

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
  crossDomainSummary?: any;
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

// ==========================================
// V1.3.0 - CAMADA POLIMÓRFICA DE CONSUMO
// V1.4.0 - MANIFEST ENFORCEMENT
// ==========================================

export function resolvePackageState(
  context: AbluteContext, 
  domain: string, 
  manifestDecl?: { consumedDomains?: string[] }
): { status: 'allowed' | 'denied' | 'unavailable' | 'missing' | 'unauthorized_by_manifest' | 'stale_blocked', pkg: DomainPackage | null } {
  
  // Guardrail SDK V1.4: Prevenção de chamada abusiva manual
  if (manifestDecl && manifestDecl.consumedDomains) {
    if (!manifestDecl.consumedDomains.includes(domain)) {
      console.error(`[AbluteSDK Security] Mini-App attempted to read undeclared domain "${domain}".`);
      return { status: 'unauthorized_by_manifest', pkg: null };
    }
  }

  const pkg = getDomainPackage(context, domain);
  if (!pkg) return { status: 'missing', pkg: null };
  return { status: pkg.exposurePolicy as any, pkg };
}

export function getAllowedDomainPackage(context: AbluteContext, domain: string, manifest?: any): DomainPackage | null {
  const { status, pkg } = resolvePackageState(context, domain, manifest);
  if (status === 'allowed') return pkg;
  return null;
}

export function getPackageFacts(context: AbluteContext, domain: string, manifest?: any): any[] {
  const pkg = getAllowedDomainPackage(context, domain, manifest);
  return pkg ? pkg.facts : [];
}

export function getPackageSignals(context: AbluteContext, domain: string, manifest?: any): any | null {
  const pkg = getAllowedDomainPackage(context, domain, manifest);
  return pkg ? pkg.signals : null;
}

export function getCrossDomainSummary(context: AbluteContext, manifestDecl?: any) {
  if (manifestDecl && manifestDecl.supportsCrossDomainSummary === false) {
    return null;
  }
  return context.crossDomainSummary || null;
}

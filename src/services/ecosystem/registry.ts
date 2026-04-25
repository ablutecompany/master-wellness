import { MiniAppRegistryEntry } from '../../store/ecosystem-contracts';
import { MINI_APP_CATALOG } from '../../miniapps/catalog';

/**
 * @file registry.ts
 * @description Gestor do registo oficial de Mini-Apps na shell.
 * Mapeia o catálogo visual para contratos operacionais.
 */

/**
 * Converte o catálogo de manifestos (UI) para entradas de registo de ecossistema (Shell).
 */
export const ECOSYSTEM_REGISTRY: MiniAppRegistryEntry[] = MINI_APP_CATALOG.map(app => ({
  miniapp_id: app.id,
  domain: app.category,
  contract_version: app.bridgeContractVersion || '1.0',
  allowed_input_scopes: app.permissions.map(p => p.toLowerCase()),
  allowed_output_scopes: (app as any).output_scopes || [], // Suporte a futuras extensões do manifesto
  writes_longitudinal_memory: app.category === 'longevity' || app.category === 'nutrition',
  influences_global_profile: app.category === 'nutrition' || app.category === 'fitness',
  requires_consents: true,
  supports_offline_fallback: false
}));

/**
 * Procura uma entrada no registo pelo ID da mini-app.
 */
export const getRegistryEntry = (id: string): MiniAppRegistryEntry | undefined => {
  return ECOSYSTEM_REGISTRY.find(entry => entry.miniapp_id === id);
};

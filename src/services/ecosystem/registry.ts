import { MiniAppRegistryEntry } from '../../store/ecosystem-contracts';

/**
 * @file registry.ts
 * @description Gestor do registo oficial de Mini-Apps na shell.
 * Define os scopes de dados e as capacidades de governação de forma endurecida.
 * A verdade reside nos contratos (scopes) e não apenas na UI.
 */

/**
 * Registo Mestre de Mini-Apps (Governação de Scopes)
 */
export const ECOSYSTEM_REGISTRY: MiniAppRegistryEntry[] = [
  {
    miniapp_id: 'femmhealth',
    domain: 'female-health',
    contract_version: '1.0.0',
    allowed_input_scopes: ['profile:read', 'biological:urinalysis:read', 'lifecycle:menstrual:read'],
    allowed_output_scopes: ['lifecycle:menstrual:write', 'symptoms:write'],
    writes_longitudinal_memory: true,
    influences_global_profile: false,
    requires_consents: true,
    supports_offline_fallback: false
  },
  {
    miniapp_id: 'nutri-menu',
    domain: 'nutrition',
    contract_version: '1.2.0',
    allowed_input_scopes: ['profile:read', 'biological:urinalysis:read', 'metabolic:read'],
    allowed_output_scopes: ['nutrition:intake:write', 'preferences:nutrition:write'],
    writes_longitudinal_memory: true,
    influences_global_profile: true,
    requires_consents: true,
    supports_offline_fallback: true
  },
  {
    miniapp_id: 'sleep-deep',
    domain: 'sleep',
    contract_version: '1.2.0',
    allowed_input_scopes: ['profile:read', 'biological:heart_rate:read', 'biological:hrv:read'],
    allowed_output_scopes: ['sleep:summary:write', 'sleep:events:write'],
    writes_longitudinal_memory: true,
    influences_global_profile: false,
    requires_consents: true,
    supports_offline_fallback: false
  },
  {
    miniapp_id: 'longevity-secrets',
    domain: 'longevity',
    contract_version: '1.1.0',
    allowed_input_scopes: ['profile:read', 'biological:all:read', 'activity:read'],
    allowed_output_scopes: ['longevity:protocol:write'],
    writes_longitudinal_memory: true,
    influences_global_profile: true,
    requires_consents: true,
    supports_offline_fallback: false
  }
];

/**
 * Procura uma entrada no registo pelo ID da mini-app.
 */
export const getRegistryEntry = (id: string): MiniAppRegistryEntry | undefined => {
  return ECOSYSTEM_REGISTRY.find(entry => entry.miniapp_id === id);
};

/**
 * Verifica se uma app tem permissão para um determinado scope de entrada.
 */
export const canAppReadScope = (appId: string, scope: string): boolean => {
  const entry = getRegistryEntry(appId);
  if (!entry) return false;
  return entry.allowed_input_scopes.includes(scope) || entry.allowed_input_scopes.includes('*:read');
};

/**
 * Verifica se uma app tem permissão para um determinado scope de saída.
 */
export const canAppWriteScope = (appId: string, scope: string): boolean => {
  const entry = getRegistryEntry(appId);
  if (!entry) return false;
  return entry.allowed_output_scopes.includes(scope);
};

/**
 * @file ecosystem-contracts.ts
 * @description Contratos base para a shell ablute_wellness assumir o papel de centralina operacional do ecossistema.
 * @version 1.0.0
 * @language PT-PT
 */

/**
 * Estado de "frescura" ou validade de um dado ou pacote de contexto.
 */
export type FreshnessStatus = 
  | 'fresh'                // Dado atual e dentro da janela de validade ideal
  | 'usable_with_warning' // Dado ainda utilizável, mas fora da janela ideal (stale iminente)
  | 'stale'               // Dado expirado ou demasiado antigo para decisões críticas
  | 'unavailable';        // Dado inexistente ou impossível de recuperar

/**
 * Representa um item individual dentro de um pacote de contexto.
 */
export interface ContextBundleItem {
  key: string;               // Chave identificadora do dado (ex: "heart_rate_avg")
  value: any;                // Valor do dado (pode ser primitivo ou objeto complexo)
  observed_at: number;       // Timestamp de quando o dado foi observado originalmente
  updated_at: number;        // Timestamp da última atualização na shell
  source: string;            // Identificador da fonte (app_id, sensor_id ou "system")
  confidence: number;        // Nível de confiança no dado (0.0 a 1.0)
  status: FreshnessStatus;   // Estado de validade atual deste item específico
  freshness_reason?: string; // Justificação para o status (ex: "TTL expired", "Sensor noise")
}

/**
 * Pacote de contexto consolidado pela Shell para consumo por mini-apps ou motores de IA.
 */
export interface ContextBundle {
  context_version: string;   // Versão do esquema do contrato de contexto
  generated_at: number;      // Quando é que este bundle foi montado
  app_scope: string;         // ÂmScope de aplicação (ex: "nutrition_optimizer")
  user_mode: 'guest' | 'authenticated'; // Modo de sessão do utilizador
  bundle_status: FreshnessStatus; // Estado global de validade do bundle
  items: ContextBundleItem[]; // Lista de factos/dados contidos no pacote
  interpreted_actions?: InterpretedAction[]; // Diretivas interpretadas pela Shell
}

/**
 * Registo de uma Mini-App na Shell para gestão de capacidades e permissões.
 */
export interface MiniAppRegistryEntry {
  miniapp_id: string;               // ID único da mini-app
  domain: string;                   // Domínio principal (ex: "sleep", "nutrition")
  contract_version: string;         // Versão do contrato que a app suporta
  allowed_input_scopes: string[];   // Scopes de leitura permitidos
  allowed_output_scopes: string[];  // Scopes de escrita permitidos
  writes_longitudinal_memory: boolean; // Se a app contribui para o histórico a longo prazo
  influences_global_profile: boolean;   // Se a app pode alterar biomarcadores base do perfil
  requires_consents: boolean;       // Se a app exige gestão de consentimentos explícitos
  supports_offline_fallback: boolean; // Se tem capacidades de funcionamento offline
}

/**
 * Evento de contribuição enviado por uma fonte externa (mini-app ou sensor) para a Shell.
 */
export interface ContributionEvent {
  event_id: string;          // UUID do evento
  miniapp_id: string;        // ID da app que originou o evento
  event_type: string;        // Tipo de contribuição (ex: "meal_logged", "step_goal_reached")
  payload: any;              // Dados específicos do evento
  confidence: number;        // Confiança reportada pela fonte
  recorded_at: number;       // Quando ocorreu o evento na fonte
  received_at: number;       // Quando foi processado pela Shell
  contract_version: string;  // Versão do contrato usada no evento
}

/**
 * Sumário de sessão operativa (ex: após fecho de uma mini-app ou ciclo de análise).
 */
export interface SessionSummary {
  session_id: string;        // ID da sessão
  start_at: number;          // Início da sessão
  end_at: number;            // Fim da sessão
  miniapp_id?: string;       // App envolvida (opcional)
  events_count: number;      // Número de eventos gerados
  outcome_status: 'success' | 'incomplete' | 'failed'; // Resultado da sessão
  consumed_credits: number;  // Créditos ou tokens gastos
}

/**
 * Tipos básicos de consentimento e âmbito (scope).
 */
export type ConsentLevel = 'denied' | 'implied' | 'explicit';

export interface ConsentScope {
  scope_id: string;          // Identificador do scope (ex: "biometrics:read")
  level: ConsentLevel;       // Nível de permissão atual
  granted_at?: number;       // Quando foi concedido
  expires_at?: number;       // Validade do consentimento
  reason?: string;           // Motivo ou descrição para o utilizador
}

/**
 * Representa uma ação ou diretiva interpretada pela Shell a partir de dados brutos ou análises IA.
 */
export interface InterpretedAction {
  action_id: string;         // Identificador único da ação
  domain_target: string;     // Domínio alvo (ex: "nutrition", "motion")
  action_type: string;       // Tipo da ação (ex: "hydration_focus", "nutrient_priority")
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;            // Justificação estruturada da shell
  confidence: number;        // Nível de confiança na interpretação
  source_set: string[];      // IDs de factos ou eventos que originaram a ação
  generated_at: number;      // Timestamp de geração
  expires_at: number;        // Quando a ação deixa de ser válida/útil
  status: 'active' | 'degraded' | 'expired';
  payload?: any;             // Parâmetros extra da ação (ex: { nutrient: "magnesium" })
}

/**
 * Conjunto de ações interpretadas para um domínio específico.
 */
export interface InterpretedActionSet {
  domain_target: string;
  generated_at: number;
  actions: InterpretedAction[];
}

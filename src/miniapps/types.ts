// ─────────────────────────────────────────────────────────────────────────────
// Mini-App type definitions
// ─────────────────────────────────────────────────────────────────────────────

export type MiniAppCategory =
  | 'female-health'
  | 'sleep'
  | 'nutrition'
  | 'mental'
  | 'fitness'
  | 'longevity';

export type Permission =
  | 'PROFILE_READ'
  | 'HEALTH_DATA_READ'
  | 'NOTIFICATIONS'
  | 'CYCLE_DATA_READ'
  | 'NUTRITION_DATA_READ'
  | 'SLEEP_DATA_READ'
  | 'ACTIVITY_DATA_READ';

export const PERMISSION_LABELS: Record<Permission, { label: string; desc: string; icon: string }> = {
  PROFILE_READ: {
    label: 'Perfil da utilizadora',
    desc: 'Nome, idade, objetivos de saúde e preferências',
    icon: '👤',
  },
  HEALTH_DATA_READ: {
    label: 'Dados de saúde',
    desc: 'Biomarcadores, ECG, HRV e leituras de sensores',
    icon: '💊',
  },
  NOTIFICATIONS: {
    label: 'Notificações',
    desc: 'Enviar lembretes e alertas contextuais',
    icon: '🔔',
  },
  CYCLE_DATA_READ: {
    label: 'Dados do ciclo',
    desc: 'Ciclo menstrual, sintomas e padrões hormonais',
    icon: '🌙',
  },
  NUTRITION_DATA_READ: {
    label: 'Dados de nutrição',
    desc: 'Refeições, macros e preferências alimentares',
    icon: '🥗',
  },
  SLEEP_DATA_READ: {
    label: 'Dados de sono',
    desc: 'Padrões de sono, fases e qualidade',
    icon: '💤',
  },
  ACTIVITY_DATA_READ: {
    label: 'Dados de atividade',
    desc: 'Exercício, passos e dados de movimento',
    icon: '🏃',
  },
};

export const CATEGORY_LABELS: Record<MiniAppCategory, string> = {
  'female-health': 'Saúde Feminina',
  'sleep': 'Sono',
  'nutrition': 'Nutrição Personalizada',
  'mental': 'Autoconhecimento',
  'fitness': 'Fitness',
  'longevity': 'Longevidade',
};

export interface MiniAppManifest {
  id: string;
  name: string;
  tagline: string;
  developer: string;
  developerVerified: boolean;
  category: MiniAppCategory;
  iconEmoji: string;
  iconColor: string;     // accent/primary colour
  iconBg: string;        // icon background colour
  url: string;           // HTTPS URL of the web app
  permissions: Permission[];
  version: string;
  featured: boolean;
  rating?: number;
  reviewCount?: number;
  description?: string;
  publisher?: string;      // Ex: 'ablute_ official'
  screenshots?: string[];  // Array de URLs de imagens/screenshots
  releaseDate?: string;    // ISO date string
  availabilityStatus?: 'available' | 'coming_soon';
  accentColor?: string;

  // ──────────────────────────────────────────
  // V1.4.0 Manifesto Semântico (Contract Requirements)
  // ──────────────────────────────────────────
  consumedDomains?: string[]; // Ex: ['sleep', 'nutrition']
  supportedPackageVersions?: string[]; // Ex: ['1.2.0', '1.3.0']
  supportsCrossDomainSummary?: boolean; // App lida com conclusões agregadas?
  bridgeContractVersion?: string; // Ex: '1.4'
  requiresFreshData?: boolean; // Manda invalidar caches ativamente?
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics event
// ─────────────────────────────────────────────────────────────────────────────
export interface AnalyticsEvent {
  event: 'APP_LAUNCHED' | 'APP_CLOSED' | 'APP_INSTALLED' | 'APP_UNINSTALLED' | 'MINI_APP_ANALYTICS' | 'MINI_APP_READY' | 'PACKAGE_CONSUMED';
  appId: string;
  timestamp: number;
  meta?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini-App Write-Back Events & Messaging
// ─────────────────────────────────────────────────────────────────────────────

export type ContributionEventType =
  | 'preference_changed'
  | 'context_note_added'
  | 'meal_accepted'
  | 'meal_rejected'
  | 'ingredient_disliked'
  | 'sleep_pattern_changed'
  | 'sleep_debt_detected'
  | 'fatigue_context_added';

export interface AppContributionEvent {
  eventId: string;
  sourceAppId: string;
  eventType: ContributionEventType;
  payload: any;
  recordedAt: number;
  receivedAt: number; // Metadata da Shell
  eventVersion: string; // e.g. "1.0"
  source: 'miniapp' | 'system' | 'bridge';
  confidence?: number;
  validityWindow?: number;
  contextVersion?: string; // Versão do contexto no momento do evento
}

export type MiniAppMessageType = 
  | 'app_ready'
  | 'context_request'
  | 'contribution_event'
  | 'analytics_event'
  | 'close_app'
  | 'package_read';

export interface MiniAppMessage {
  type: MiniAppMessageType;
  payload?: any;
  // Metadata & Versioning (Harden Envelope)
  appId?: string;
  timestamp?: number;
  version?: string;
  source?: string;
  sessionId?: string;
}

// Legacy support (to be deprecated)
export interface MiniAppEvent {
  eventId: string;
  sourceApp: string;
  eventType: string;
  payload: any;
  recordedAt: number;
  confidence?: number;
  validityWindow?: number;
}

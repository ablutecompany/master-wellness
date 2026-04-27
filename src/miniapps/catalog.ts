import { MiniAppManifest } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Official ablute_ Mini-App Catalog
// Manually curated — no arbitrary code loading.
//
// HOW TO ADD A NEW MINI-APP:
//  1. Deploy the web app to a HTTPS URL
//  2. Add a manifest entry below
//  3. Declare all permissions the app will use
//  4. Set featured: true if it appears in the banner
// ─────────────────────────────────────────────────────────────────────────────
export const MINI_APP_CATALOG: MiniAppManifest[] = [
  {
    id: 'introspect',
    name: '_introspect',
    tagline: 'Fontes reais de stress e padrões de comportamento',
    developer: 'ablute_ Labs',
    developerVerified: true,
    category: 'mental',
    iconEmoji: '🧠',
    iconColor: '#0EA5E9',
    iconBg: 'rgba(14, 165, 233, 0.12)',
    url: 'https://introspect-ai.vercel.app',
    permissions: ['PROFILE_READ', 'NOTIFICATIONS'],
    version: '1.0.0',
    featured: true,
    rating: 4.9,
    reviewCount: 42,
    description: 'Introspeção guiada que conversa contigo para localizar fontes reais de stress, clarificar padrões e transformar cada sessão em passos concretos.',
    publisher: 'ablute_ official',
    screenshots: [], // Preparado para receber assets reais
    releaseDate: '2024-04-20',
    consumedDomains: ['mental'],
    bridgeContractVersion: '1.4',
  },
  {
    id: 'meal-planner',
    name: '_Meal Planner',
    tagline: 'Planeamento familiar e nutrição inteligente',
    developer: 'ablute_ Labs',
    developerVerified: true,
    category: 'nutrition',
    iconEmoji: '🥗',
    iconColor: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    url: 'https://eat-psi-three.vercel.app/',
    permissions: ['PROFILE_READ', 'NUTRITION_DATA_READ', 'NOTIFICATIONS'],
    version: '1.1.0',
    featured: true,
    rating: 4.8,
    reviewCount: 31,
    description: 'Planeie refeições em família de acordo com requisitos nutricionais reais, restrições e participantes por refeição, ajustando quantidades e preferências. Automatize a lista de compras e encomende diretamente para casa.',
    publisher: 'ablute_ official',
    screenshots: [], // Preparado para receber assets reais
    releaseDate: '2024-04-15',
    consumedDomains: ['nutrition'],
    bridgeContractVersion: '1.4',
  },
];

export const getFeaturedApp = (): MiniAppManifest | undefined =>
  MINI_APP_CATALOG.find((app) => app.featured);

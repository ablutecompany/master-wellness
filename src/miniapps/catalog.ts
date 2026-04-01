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
    id: 'femmhealth',
    name: '_Fem sanctuary',
    tagline: 'Ciclo, sintomas e saúde hormonal num só lugar',
    developer: 'ablute_ Labs',
    developerVerified: true,
    category: 'female-health',
    iconEmoji: '♀',
    iconColor: '#FF6FBA',
    iconBg: 'rgba(255, 111, 186, 0.12)',
    url: 'https://femmhealth.vercel.app',
    permissions: ['PROFILE_READ', 'CYCLE_DATA_READ', 'NOTIFICATIONS'],
    version: '1.0.0',
    featured: false,
    rating: 4.9,
    reviewCount: 128,
    description:
      'Acompanha o teu ciclo menstrual com IA, regista sintomas diários, acede a conteúdo de saúde feminina baseado em evidência e conecta-te com uma comunidade de mulheres.',
  },
  {
    id: 'nutri-menu',
    name: '_Meal planner',
    tagline: 'Planeamento de refeições em família, inteligente e partilhável',
    developer: 'ablute_ Labs',
    developerVerified: true,
    category: 'nutrition',
    iconEmoji: '🍽',
    iconColor: '#00D4AA',
    iconBg: 'rgba(0, 212, 170, 0.12)',
    url: 'https://eat-psi-three.vercel.app',
    permissions: ['PROFILE_READ', 'NUTRITION_DATA_READ', 'NOTIFICATIONS'],
    version: '1.2.0', // Migração concluída para domainPackages (Real)
    featured: true,
    rating: 4.8,
    reviewCount: 74,
    description:
      'Planeia as refeições da semana para toda a família, gera listas de compras partilháveis via WhatsApp ou email, e descobre menus personalizados com base nos teus objetivos nutricionais.',
    consumedDomains: ['nutrition'],
    supportedPackageVersions: ['1.2.0', '1.3.0'],
    supportsCrossDomainSummary: false,
    bridgeContractVersion: '1.4',
  },
  {
    id: 'sleep-deep',
    name: 'deep sleep',
    tagline: 'Sono de qualidade com binaural & HRV tracking',
    developer: 'NeuroRest',
    developerVerified: false,
    category: 'sleep',
    iconEmoji: '🌙',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139, 92, 246, 0.12)',
    url: 'https://deepsleep-kappa.vercel.app/',
    permissions: ['PROFILE_READ', 'SLEEP_DATA_READ', 'NOTIFICATIONS'],
    version: '1.2.0', // Migração concluída para domainPackages (Real)
    featured: false,
    rating: 4.7,
    reviewCount: 64,
    description:
      'Melhora a qualidade do sono com sons binaurais, meditações guiadas e análise de HRV integrada com os teus wearables.',
    consumedDomains: ['sleep', 'energy'], // Exemplifica que o sono consome a sua recuperação e a energia
    supportedPackageVersions: ['1.2.0'],
    bridgeContractVersion: '1.4',
  },
  {
    id: 'gut-sync',
    name: 'Gut Sync',
    tagline: 'Microbioma e digestão: diário alimentar inteligente',
    developer: 'Microbiome Labs',
    developerVerified: true,
    category: 'nutrition',
    iconEmoji: '🌱',
    iconColor: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    url: 'https://gut-sync.vercel.app',
    permissions: ['PROFILE_READ', 'NUTRITION_DATA_READ', 'NOTIFICATIONS'],
    version: '1.2.0',
    featured: false,
    rating: 4.5,
    reviewCount: 42,
    description:
      'Regista as tuas refeições, identifica padrões inflamatórios e recebe recomendações personalizadas para melhorar a tua saúde intestinal.',
  },
  {
    id: 'mindful-breath',
    name: 'Mindful Breath',
    tagline: 'Respiração guiada e gestão de stress com HRV',
    developer: 'Calm Systems',
    developerVerified: false,
    category: 'mental',
    iconEmoji: '🧘',
    iconColor: '#0EA5E9',
    iconBg: 'rgba(14, 165, 233, 0.12)',
    url: 'https://mindful-breath.vercel.app',
    permissions: ['PROFILE_READ', 'NOTIFICATIONS'],
    version: '2.0.1',
    featured: false,
    rating: 4.8,
    reviewCount: 91,
    description:
      'Técnicas de respiração baseadas em evidência (4-7-8, Box, Wim Hof) com biofeedback em tempo real de HRV para reduzir stress e ansiedade.',
  },
  {
    id: 'longevity-secrets',
    name: '_Healthspan',
    tagline: 'Protocolos de longevidade: jejum, frio e exercício',
    developer: 'Span Health',
    developerVerified: true,
    category: 'longevity',
    iconEmoji: '⚡',
    iconColor: '#F59E0B',
    iconBg: 'rgba(245, 158, 11, 0.12)',
    url: 'https://longevity-secrets.vercel.app',
    permissions: ['PROFILE_READ', 'ACTIVITY_DATA_READ', 'NOTIFICATIONS'],
    version: '1.1.0',
    featured: false,
    rating: 4.6,
    reviewCount: 37,
    description:
      'Guia baseado em ciência para protocolos de longevidade: jejum intermitente, exposição ao frio, zona 2 e suplementação baseada em biomarcadores.',
  },
];

export const getFeaturedApp = (): MiniAppManifest | undefined =>
  MINI_APP_CATALOG.find((app) => app.featured);

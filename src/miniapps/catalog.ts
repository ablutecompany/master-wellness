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
    name: 'FemmHealth',
    tagline: 'Ciclo, sintomas e saúde hormonal num só lugar',
    developer: 'ablute_ Labs',
    developerVerified: true,
    category: 'female-health',
    iconEmoji: '♀',
    iconColor: '#FF6FBA',
    iconBg: 'rgba(255, 111, 186, 0.12)',
    url: 'https://femmhealth-git-main-ablutecompanys-projects.vercel.app',
    permissions: ['PROFILE_READ', 'CYCLE_DATA_READ', 'NOTIFICATIONS'],
    version: '1.0.0',
    featured: true,
    rating: 4.9,
    reviewCount: 128,
    description:
      'Acompanha o teu ciclo menstrual com IA, regista sintomas diários, acede a conteúdo de saúde feminina baseado em evidência e conecta-te com uma comunidade de mulheres.',
  },
  {
    id: 'sleep-deep',
    name: 'Sleep Deep+',
    tagline: 'Optimização de sono integrada com os teus biomarcadores',
    developer: 'ablute_ Labs',
    developerVerified: true,
    category: 'sleep',
    iconEmoji: '🌙',
    iconColor: '#7B8FFF',
    iconBg: 'rgba(123, 143, 255, 0.12)',
    url: 'https://sleep-deep.vercel.app',
    permissions: ['PROFILE_READ', 'HEALTH_DATA_READ', 'NOTIFICATIONS'],
    version: '0.9.0',
    featured: false,
    rating: 4.8,
    reviewCount: 84,
    description:
      'Analisa os teus padrões de sono com base em HRV e temperatura, e sugere janelas de dormir personalizadas.',
  },
  {
    id: 'longevity-secrets',
    name: 'Longevity Secrets',
    tagline: 'Ciência da longevidade aplicada ao teu dia',
    developer: 'BioSync',
    developerVerified: true,
    category: 'longevity',
    iconEmoji: '✦',
    iconColor: '#FFD700',
    iconBg: 'rgba(255, 215, 0, 0.10)',
    url: 'https://longevity-secrets.vercel.app',
    permissions: ['PROFILE_READ', 'HEALTH_DATA_READ'],
    version: '1.2.0',
    featured: false,
    rating: 4.7,
    reviewCount: 210,
    description:
      'Protocolos diários de longevidade baseados nos teus marcadores — jejum, exercício, suplementação e sono.',
  },
  {
    id: 'nutri-menu',
    name: 'Nutri Menu',
    tagline: 'Menus personalizados à tua biologia',
    developer: 'NutriSynth',
    developerVerified: false,
    category: 'nutrition',
    iconEmoji: '🥗',
    iconColor: '#00D4AA',
    iconBg: 'rgba(0, 212, 170, 0.10)',
    url: 'https://nutri-menu.vercel.app',
    permissions: ['PROFILE_READ', 'HEALTH_DATA_READ'],
    version: '1.0.1',
    featured: false,
    rating: 4.6,
    reviewCount: 53,
    description:
      'Sugestões de refeições adaptadas ao teu perfil metabólico e dados do dia.',
  },
];

export function getAppById(id: string): MiniAppManifest | undefined {
  return MINI_APP_CATALOG.find((a) => a.id === id);
}

export function getFeaturedApp(): MiniAppManifest | undefined {
  return MINI_APP_CATALOG.find((a) => a.featured);
}

export function getAppsByCategory(category: string): MiniAppManifest[] {
  if (category === 'all') return MINI_APP_CATALOG;
  return MINI_APP_CATALOG.filter((a) => a.category === category);
}

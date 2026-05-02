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
    tagline: 'Conversação com IA para clareza mental',
    developer: 'ablute_ Labs',
    developerVerified: true,
    category: 'mental',
    iconEmoji: '🧠',
    iconName: 'Brain',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139, 92, 246, 0.12)',
    accentColor: '#8B5CF6',
    url: 'https://introspect-ai.vercel.app/',
    permissions: ['PROFILE_READ', 'NOTIFICATIONS'],
    version: '1.0.0',
    featured: true,
    rating: 4.9,
    reviewCount: 42,
    description: 'Uma app interactiva que, através de conversação com IA, ajuda a identificar factores mentais que pesam no dia-a-dia e transforma essa leitura em acções práticas de melhoria.',
    publisher: 'ablute_ official',
    screenshots: [],
    releaseDate: '2024-04-20',
    availabilityStatus: 'available',
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
    iconName: 'Utensils',
    iconColor: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    accentColor: '#10B981',
    url: 'https://eat-psi-three.vercel.app/',
    permissions: ['PROFILE_READ', 'NUTRITION_DATA_READ', 'NOTIFICATIONS'],
    version: '1.1.0',
    featured: true,
    rating: 4.8,
    reviewCount: 31,
    description: 'Planeie refeições em família de acordo com requisitos nutricionais reais, restrições e participantes por refeição, ajustando quantidades e preferências. Automatize a lista de compras e encomende diretamente para casa.',
    publisher: 'ablute_ official',
    screenshots: [
      require('../../assets/meal_planner/plano.png'),
      require('../../assets/meal_planner/receitas.png'),
      require('../../assets/meal_planner/ingredientes.png'),
      require('../../assets/meal_planner/agregado.png')
    ],
    releaseDate: '2024-04-15',
    availabilityStatus: 'available',
    consumedDomains: ['nutrition'],
    bridgeContractVersion: '1.4',
  },
  {
    id: 'deep-sleep',
    name: '_deep sleep',
    tagline: 'Monitorização e optimização do descanso',
    developer: 'ablute_ Labs',
    developerVerified: true,
    category: 'sleep',
    iconEmoji: '💤',
    iconName: 'Moon',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59, 130, 246, 0.12)',
    accentColor: '#3B82F6',
    url: 'https://deepsleep-kappa.vercel.app/',
    permissions: ['PROFILE_READ', 'SLEEP_DATA_READ'],
    version: '0.9.0',
    featured: false,
    rating: 4.7,
    reviewCount: 15,
    description: 'Monitorização do sono com identificação de fases e padrões, orientada para acções práticas que ajudam a optimizar descanso, recuperação e rotina nocturna.',
    publisher: 'ablute_ official',
    screenshots: [],
    availabilityStatus: 'available',
  },
  {
    id: 'motion',
    name: '_motion',
    tagline: 'Actividade física, equilíbrio e performance',
    developer: 'ablute_ Labs',
    developerVerified: true,
    category: 'fitness',
    iconEmoji: '🏃',
    iconName: 'Activity',
    iconColor: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    accentColor: '#10B981',
    url: 'https://motion-smoky-eta.vercel.app/',
    permissions: ['PROFILE_READ', 'ACTIVITY_DATA_READ'],
    version: '0.8.5',
    featured: false,
    rating: 4.6,
    reviewCount: 20,
    description: 'App de actividade física com vários modos de interacção, desde equilíbrio e mobilidade até desporto de alta performance, permitindo monitorização personalizada e acompanhamento próximo.',
    publisher: 'ablute_ official',
    screenshots: [],
    availabilityStatus: 'available',
  },
];

export const getFeaturedApp = (): MiniAppManifest | undefined =>
  MINI_APP_CATALOG.find((app) => app.featured);

export const CATEGORY_LABELS: Record<string, string> = {
  'female-health': 'Saúde Feminina',
  'sleep': 'Sono',
  'nutrition': 'Nutrição Personalizada',
  'mental': 'Autoconhecimento',
  'fitness': 'Movimento',
  'longevity': 'Longevidade',
};

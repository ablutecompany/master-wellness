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
    url: 'https://femmhealth.vercel.app',
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

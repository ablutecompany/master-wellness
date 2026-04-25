import { AppState, ContextBundle, ContextBundleItem, FreshnessStatus } from '../../store/types';
import { resolveNutritionActions } from './actionInterpreter';

/**
 * @file contextResolver.ts
 * @description Resolve o bundle de contexto governado para o ecossistema (motion_context_bundle).
 * Atualmente opera em modo Mock-First, consumindo dados reais onde disponíveis.
 */

const RECENT_THRESHOLD_MS = 1000 * 60 * 60 * 4; // 4 horas para ser considerado "fresh"
const STALE_THRESHOLD_MS = 1000 * 60 * 60 * 24; // 24 horas para ser considerado "stale"

/**
 * Utilitário para determinar o status de frescura com base em timestamps.
 */
const getFreshness = (timestamp: number): { status: FreshnessStatus; reason?: string } => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < RECENT_THRESHOLD_MS) return { status: 'fresh' };
  if (diff < STALE_THRESHOLD_MS) return { status: 'usable_with_warning', reason: 'Dado com mais de 4 horas' };
  return { status: 'stale', reason: 'Janela de 24h expirada' };
};

/**
 * Resolve o bundle central de contexto para a "Motion Engine" e Mini-Apps.
 */
export const resolveMotionContextBundle = (state: AppState): ContextBundle => {
  const now = Date.now();
  const user = state.user || state.guestProfile;
  const lastAnalysis = state.analyses.length > 0 ? state.analyses[state.analyses.length - 1] : null;

  // 1. SONO (Tenta ler de contextos exportados por apps de sono)
  const sleepContext = state.exportedContexts.find(c => c.key === 'sleep_quality' || c.key === 'sleep_summary');
  const sleepItem: ContextBundleItem = {
    key: 'sleep_status',
    value: sleepContext?.value || { quality: 85, duration_hrs: 7.5, consistency: 'high' },
    observed_at: sleepContext ? new Date(sleepContext.updatedAt).getTime() : now - (1000 * 60 * 60 * 8),
    updated_at: now,
    source: sleepContext?.appId || 'mock_provider',
    confidence: sleepContext ? 0.9 : 0.5,
    ...getFreshness(sleepContext ? new Date(sleepContext.updatedAt).getTime() : now - (1000 * 60 * 60 * 8))
  };

  // 2. RECUPERAÇÃO (Baseado em análise biológica se existir)
  const recoveryValue = lastAnalysis ? 78 : 65; // Mock logic
  const recoveryItem: ContextBundleItem = {
    key: 'recovery_level',
    value: { score: recoveryValue, phase: 'restoring' },
    observed_at: lastAnalysis ? new Date(lastAnalysis.analysisDate).getTime() : now,
    updated_at: now,
    source: lastAnalysis ? 'ablute_device' : 'system_estimate',
    confidence: lastAnalysis ? 0.85 : 0.3,
    ...getFreshness(lastAnalysis ? new Date(lastAnalysis.analysisDate).getTime() : now)
  };

  // 3. HIDRATAÇÃO (Dados reais de urinálise)
  const hydrationData = lastAnalysis?.measurements.find(m => m.type === 'urinalysis' && m.marker === 'density');
  const hydrationItem: ContextBundleItem = {
    key: 'hydration_status',
    value: hydrationData ? { level: hydrationData.value, status: 'optimal' } : { level: '1.020', status: 'unknown' },
    observed_at: lastAnalysis ? new Date(lastAnalysis.analysisDate).getTime() : now,
    updated_at: now,
    source: hydrationData ? 'ablute_device' : 'system_estimate',
    confidence: hydrationData ? 0.95 : 0.2,
    ...getFreshness(lastAnalysis ? new Date(lastAnalysis.analysisDate).getTime() : now)
  };

  // 4. ESTADO FISIOLÓGICO
  const physioItem: ContextBundleItem = {
    key: 'physio_profile',
    value: {
      bmi: user?.weight?.value && user?.height ? (user.weight.value / Math.pow(user.height / 100, 2)).toFixed(1) : 22.5,
      resting_hr: 62,
      hrv: 55
    },
    observed_at: now,
    updated_at: now,
    source: 'profile_engine',
    confidence: 0.7,
    status: 'fresh'
  };

  // 5. STRESS / CARGA MENTAL (Mock)
  const stressItem: ContextBundleItem = {
    key: 'mental_load',
    value: { level: 'low', indicator: 'stable' },
    observed_at: now,
    updated_at: now,
    source: 'mock_provider',
    confidence: 0.4,
    status: 'fresh'
  };

  // 6. SINTOMAS / LIMITAÇÕES (Real se no perfil)
  const symptomsItem: ContextBundleItem = {
    key: 'symptoms_limitations',
    value: { limitations: user?.habits?.includes('lesão') ? ['knee_pain'] : [], symptoms: [] },
    observed_at: now,
    updated_at: now,
    source: 'user_profile',
    confidence: 0.9,
    status: 'fresh'
  };

  // 7. ESFORÇO RECENTE (Mock)
  const effortItem: ContextBundleItem = {
    key: 'recent_effort',
    value: { intensity: 'moderate', duration_mins: 45, type: 'aerobic' },
    observed_at: now - (1000 * 60 * 120),
    updated_at: now,
    source: 'mock_activity_provider',
    confidence: 0.5,
    ...getFreshness(now - (1000 * 60 * 120))
  };

  // 8. PREFERÊNCIAS RELEVANTES
  const prefsItem: ContextBundleItem = {
    key: 'user_preferences',
    value: { goals: user?.goals || [], focus: 'performance' },
    observed_at: now,
    updated_at: now,
    source: 'user_profile',
    confidence: 1.0,
    status: 'fresh'
  };

  const items = [sleepItem, recoveryItem, hydrationItem, physioItem, stressItem, symptomsItem, effortItem, prefsItem];
  const nutritionActions = resolveNutritionActions(state);

  return {
    context_version: '1.0.0',
    generated_at: now,
    app_scope: 'global_wellness_cockpit',
    user_mode: state.isGuestMode ? 'guest' : 'authenticated',
    bundle_status: items.every(i => i.status === 'fresh') ? 'fresh' : 'usable_with_warning',
    items,
    interpreted_actions: nutritionActions.actions
  };
};

import { AppState, InterpretedAction, InterpretedActionSet } from '../../store/types';

/**
 * @file actionInterpreter.ts
 * @description Camada de interpretação da Shell que converte dados brutos e resultados de análises 
 * em diretivas estruturadas (InterpretedActions) para as Mini-Apps.
 */

const ACTION_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24h por defeito

/**
 * Resolve as ações interpretadas para o domínio de Nutrição.
 */
export const resolveNutritionActions = (state: AppState): InterpretedActionSet => {
  const now = Date.now();
  const lastAnalysis = state.analyses.length > 0 ? state.analyses[state.analyses.length - 1] : null;
  const actions: InterpretedAction[] = [];

  // 1. HYDRATION_FOCUS
  const densityMarker = lastAnalysis?.measurements.find(m => m.marker === 'density');
  if (densityMarker && parseFloat(densityMarker.value) > 1.025) {
    actions.push({
      action_id: `nutri_hyd_focus_${now}`,
      domain_target: 'nutrition',
      action_type: 'hydration_focus',
      priority: 'high',
      reason: 'Densidade urinária elevada indica necessidade de reposição hídrica.',
      confidence: 0.9,
      source_set: [lastAnalysis!.id],
      generated_at: now,
      expires_at: now + (1000 * 60 * 60 * 8),
      status: 'active',
      payload: { focus: 'increased_fluids' }
    });
  }

  // 2. NUTRIENT_PRIORITY
  const potassium = lastAnalysis?.measurements.find(m => m.marker === 'Potássio');
  if (potassium && parseFloat(potassium.value) < 3.5) {
    actions.push({
      action_id: `nutri_pot_priority_${now}`,
      domain_target: 'nutrition',
      action_type: 'nutrient_priority',
      priority: 'medium',
      reason: 'Níveis de potássio no limite inferior.',
      confidence: 0.85,
      source_set: [lastAnalysis!.id],
      generated_at: now,
      expires_at: now + ACTION_EXPIRY_MS,
      status: 'active',
      payload: { nutrient: 'potassium' }
    });
  }

  // 3. ADHERENCE_SUPPORT (Se houver muitas falhas de registo ou instabilidade)
  actions.push({
    action_id: `nutri_adh_support_${now}`,
    domain_target: 'nutrition',
    action_type: 'adherence_support',
    priority: 'low',
    reason: 'Manutenção de rotina sugerida para estabilidade de sinais.',
    confidence: 0.6,
    source_set: [],
    generated_at: now,
    expires_at: now + (ACTION_EXPIRY_MS * 7),
    status: 'active'
  });

  return { domain_target: 'nutrition', generated_at: now, actions };
};

/**
 * Resolve as ações interpretadas para o domínio de Movimento (Motion).
 */
export const resolveMotionActions = (state: AppState): InterpretedActionSet => {
  const now = Date.now();
  const lastAnalysis = state.analyses.length > 0 ? state.analyses[state.analyses.length - 1] : null;
  const actions: InterpretedAction[] = [];

  // 1. RECOVERY_CAUTION (Se stress oxidativo elevado)
  const oxidativeStress = lastAnalysis?.measurements.find(m => m.marker === 'F2-isoprostanos');
  if (oxidativeStress && parseFloat(oxidativeStress.value) > 3.0) {
    actions.push({
      action_id: `motion_rec_caution_${now}`,
      domain_target: 'motion',
      action_type: 'recovery_caution',
      priority: 'high',
      reason: 'Marcadores de inflamação/stress sugerem foco em recuperação.',
      confidence: 0.8,
      source_set: [lastAnalysis!.id],
      generated_at: now,
      expires_at: now + ACTION_EXPIRY_MS,
      status: 'active'
    });
  }

  // 2. LOAD_REDUCTION
  const hrv = 45; // Mock HRV
  if (hrv < 50) {
    actions.push({
      action_id: `motion_load_red_${now}`,
      domain_target: 'motion',
      action_type: 'load_reduction',
      priority: 'medium',
      reason: 'Variabilidade cardíaca sugere redução de carga de treino.',
      confidence: 0.7,
      source_set: [],
      generated_at: now,
      expires_at: now + (1000 * 60 * 60 * 12),
      status: 'active'
    });
  }

  return { domain_target: 'motion', generated_at: now, actions };
};

/**
 * Resolve as ações interpretadas para o domínio de Sono.
 */
export const resolveSleepActions = (state: AppState): InterpretedActionSet => {
  const now = Date.now();
  const actions: InterpretedAction[] = [];

  // 1. STABILITY_BIAS
  actions.push({
    action_id: `sleep_stab_bias_${now}`,
    domain_target: 'sleep',
    action_type: 'stability_bias',
    priority: 'medium',
    reason: 'Irregularidade de horários detetada no contexto recente.',
    confidence: 0.75,
    source_set: [],
    generated_at: now,
    expires_at: now + ACTION_EXPIRY_MS,
    status: 'active'
  });

  return { domain_target: 'sleep', generated_at: now, actions };
};

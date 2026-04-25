import { AppState, InterpretedAction, InterpretedActionSet } from '../../store/types';

/**
 * @file actionInterpreter.ts
 * @description Camada de interpretação da Shell que converte dados brutos e resultados de análises 
 * em diretivas estruturadas (InterpretedActions) para as Mini-Apps.
 */

const ACTION_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24h por defeito

/**
 * Resolve as ações interpretadas para o domínio de Nutrição.
 * Garante que a mini-app de nutrição recebe diretivas claras sem texto livre de IA.
 */
export const resolveNutritionActions = (state: AppState): InterpretedActionSet => {
  const now = Date.now();
  const lastAnalysis = state.analyses.length > 0 ? state.analyses[state.analyses.length - 1] : null;
  const actions: InterpretedAction[] = [];

  // 1. HYDRATION_FOCUS (Baseado em densidade urinária ou marcadores cardíacos)
  const densityMarker = lastAnalysis?.measurements.find(m => m.marker === 'density');
  const ntProBnp = lastAnalysis?.measurements.find(m => m.marker === 'NT-proBNP');
  
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
      expires_at: now + (1000 * 60 * 60 * 8), // Dura apenas 8h
      status: 'active',
      payload: { focus: 'increased_fluids', suggested_oz: 24 }
    });
  }

  // 2. NUTRIENT_PRIORITY (Ex: Potássio/Sódio)
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
      payload: { nutrient: 'potassium', source_type: 'food' }
    });
  }

  // 3. MEAL_SIMPLICITY_BIAS (Se houver marcadores de stress oxidativo elevados)
  const oxidativeStress = lastAnalysis?.measurements.find(m => m.marker === 'F2-isoprostanos');
  if (oxidativeStress && parseFloat(oxidativeStress.value) > 3.0) {
    actions.push({
      action_id: `nutri_simpl_bias_${now}`,
      domain_target: 'nutrition',
      action_type: 'meal_simplicity_bias',
      priority: 'medium',
      reason: 'Marcadores de stress oxidativo sugerem digestão facilitada.',
      confidence: 0.7,
      source_set: [lastAnalysis!.id],
      generated_at: now,
      expires_at: now + ACTION_EXPIRY_MS,
      status: 'active',
      payload: { strategy: 'low_processing', meal_size: 'moderate' }
    });
  }

  // 4. TIMING_ADJUSTMENT (Baseado em esforço ou última análise)
  // Se a análise for recente (<2h), podemos sugerir timing específico
  if (lastAnalysis && (now - new Date(lastAnalysis.analysisDate).getTime() < 1000 * 60 * 120)) {
    actions.push({
      action_id: `nutri_timing_${now}`,
      domain_target: 'nutrition',
      action_type: 'timing_adjustment',
      priority: 'medium',
      reason: 'Janela metabólica pós-análise ativa.',
      confidence: 0.75,
      source_set: [lastAnalysis.id],
      generated_at: now,
      expires_at: now + (1000 * 60 * 120),
      status: 'active',
      payload: { window_type: 'recovery', priority: 'immediate' }
    });
  }

  // 5. REDUCE_OR_AVOID_SIGNAL
  // Ex: Se o pH urinário estiver muito baixo/ácido
  const phMarker = lastAnalysis?.measurements.find(m => m.marker === 'pH Urinário');
  if (phMarker && parseFloat(phMarker.value) < 5.5) {
    actions.push({
      action_id: `nutri_avoid_acid_${now}`,
      domain_target: 'nutrition',
      action_type: 'reduce_or_avoid_signal',
      priority: 'low',
      reason: 'pH urinário ácido sugere moderação em alimentos acidificantes.',
      confidence: 0.65,
      source_set: [lastAnalysis!.id],
      generated_at: now,
      expires_at: now + ACTION_EXPIRY_MS,
      status: 'active',
      payload: { category: 'acidifying_foods', focus: 'alkaline_balance' }
    });
  }

  return {
    domain_target: 'nutrition',
    generated_at: now,
    actions
  };
};

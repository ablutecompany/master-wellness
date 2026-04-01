/**
 * MATRIZ DE INPUTS: DOMÍNIO ENERGY
 * 
 * Este ficheiro governa e documenta os limites, pesos e requisitos do motor
 * semântico para a determinação de Energy.
 * 
 * -- PRINCÍPIO DE DETERMINISMO --
 * Apenas inputs processados neste contrato ativam a marcação "dirty"
 * no ciclo de vida do Frontend (Domain Affinity).
 */

export const ENERGY_INPUT_CONTRACT = {
  domain: 'energy',
  version: '1.2.0',
  
  // Condições para atingir estado "Ready" (sufficient_data)
  // Requer que existam pelo menos 3 medições submetidas nos marcadores admitidos abaixo.
  minimumMaturityReq: 3,

  weights: {
    glucose: 0.6,       // Proxy primário de combustão e pico de energia metabólica
    hydration: 0.4      // Modulador enzimático e circulatório de fadiga sistémica
  },

  frontendTriggers: {
    // Apenas estes tipos de evento front-end devem marcar Energy como Stale
    measurements: ['urinalysis', 'weight'], // Urinalysis espelha hidratação, Weight para retenção
    events: ['meal_log']                    // Meal Log afeta diretamente predição de glucose
  },

  ignoredInputs: {
    // Motivos documentados:
    'ppg': 'Marcador de performance cardiovascular, mas sem peso causal imediato configurado nesta V1 do engine de Energy.',
    'ecg': 'Não afeta diretamente o score base de energy metabólico (priorizado p/ Performance).',
    'sleep_log': 'Carga regenerativa indireta; o engine está dependente do estado metabólico puro ativo.'
  }
};

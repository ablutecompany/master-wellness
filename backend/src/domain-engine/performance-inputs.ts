/**
 * MATRIZ DE INPUTS: DOMÍNIO PERFORMANCE
 * 
 * Este ficheiro governa e documenta os limites, pesos e requisitos do motor
 * semântico para a determinação de Performance (Capacidade de Desempenho).
 * 
 * -- PRINCÍPIO DE DETERMINISMO --
 * Apenas inputs processados neste contrato ativam a marcação "dirty"
 * no ciclo de vida do Frontend (Domain Affinity).
 */

export const PERFORMANCE_INPUT_CONTRACT = {
  domain: 'performance',
  version: '1.2.0',
  
  // Condições para atingir estado "Ready" (sufficient_data)
  // Requer pelo menos 3 fluxos de dados biográficos dos marcadores aprovados abaixo.
  minimumMaturityReq: 3,

  weights: {
    activity_load: 0.7,   // Proxy direto da carga física processada (esforço cardiovascular/muscular)
    hydration: 0.3        // Componente permissivo para o esforço sustentável
  },

  frontendTriggers: {
    measurements: ['urinalysis'], // Urinalysis espelha indiretamente o output de hidratação
    events: ['step_goal_reached'] // Proxy bruto de threshold de atividade
  },

  ignoredInputs: {
    // Motivos documentados da V1.2.0:
    'ecg': 'Não é utilizado no scoring matemático da Performance neste nível. Representa estabilidade elétrica, não carga ativa.',
    'heart_rate_variability': 'Considerado proxy de stress, mas o score V1 suporta-se apenas na medição real da carga vs hidratação.'
  }
};

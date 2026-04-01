/**
 * MATRIZ DE INPUTS: DOMÍNIO RECOVERY
 * 
 * Este ficheiro governa e documenta os limites, pesos e requisitos do motor
 * semântico para a determinação de Recovery (Capacidade de Recuperação).
 * 
 * -- PRINCÍPIO DE DETERMINISMO --
 * Apenas inputs processados neste contrato ativam a marcação "dirty"
 * no ciclo de vida do Frontend (Domain Affinity).
 */

export const RECOVERY_INPUT_CONTRACT = {
  domain: 'recovery',
  version: '1.2.0',
  
  // Condições para atingir estado "Ready" (sufficient_data)
  // Requer pelo menos 3 fluxos de dados biográficos dos marcadores aprovados abaixo.
  minimumMaturityReq: 3,

  weights: {
    urea: 0.5,            // Marker metabólico de hidratação/clearance renal (catabolismo)
    sleep_quality: 0.5    // Marker consolidado de recuperação do sistema nervoso/muscular
  },

  frontendTriggers: {
    measurements: ['urinalysis'], // Proxy base para o marcador de urea
    events: ['sleep_log']         // Logística declarativa ou medição noturna (sleep_quality)
  },

  ignoredInputs: {
    // Motivos documentados da V1.2.0:
    'ppg': 'Sinal bruto sem consolidação unívoca validada de stress biográfico nesta fase.',
    'ecg': 'Ponte para Performance e Alostase, mas não usado isoladamente no Recovery score atual.',
    'heart_rate_variability': 'Considerado marcador universal, mas o scoring V1 de recovery concentra-se em output metabólico passivo e sono estabilizado (urea + sleep base).'
  }
};

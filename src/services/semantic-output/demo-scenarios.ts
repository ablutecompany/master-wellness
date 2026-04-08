/**
 * DEMO SCENARIOS
 * Define os dados de biomarcadores para cada cenário demo.
 * O semanticBundle é CALCULADO pelo analysis-engine — nunca hardcoded aqui.
 */

import { computeSemanticFromMeasurements } from './analysis-engine';
import { SemanticOutputState } from './types';
import { AnalysisMeasurement, AnalysisEvent, Analysis } from '../../store/types';

export type DemoScenarioKey =
  | 'balanced'
  | 'low_energy'
  | 'poor_recovery'
  | 'irregular_digestion'
  | 'unstable_rhythm'
  | 'mixed';

// DemoMeasurement e DemoEcosystemFact são agora aliases dos tipos unificados do store
export type DemoMeasurement = AnalysisMeasurement;
export type DemoEcosystemFact = AnalysisEvent;

// ── Helpers ───────────────────────────────────────────────────────────────────

const TS = '2026-04-02T08:00:00.000Z';
const FAR = 9999999999999;
let _idx = 0;

function u(marker: string, value: string, unit: string): AnalysisMeasurement {
  return { id: `demo_m_${_idx++}`, type: 'urinalysis', marker, value, unit, recordedAt: TS };
}
function ph(type: 'ecg' | 'ppg' | 'temp' | 'weight', marker: string, value: string, unit: string): AnalysisMeasurement {
  return { id: `demo_m_${_idx++}`, type, marker, value, unit, recordedAt: TS };
}
function fecal(marker: string, value: string): AnalysisMeasurement {
  return { id: `demo_m_${_idx++}`, type: 'fecal', marker, value, unit: '', recordedAt: TS };
}
function eco(type: string, value: string, sourceAppId: string): AnalysisEvent {
  return {
    id: `demo_eco_${_idx++}`, type, value, sourceAppId,
    recordedAt: TS,
  };
}

// ── 6 CENÁRIOS ────────────────────────────────────────────────────────────────

const SCENARIOS_DATA: Record<DemoScenarioKey, { measurements: AnalysisMeasurement[]; ecosystemFacts: AnalysisEvent[] }> = {

  balanced: {
    measurements: [
      u('Gravidade Específica', '1.020', 'sg'), u('pH Urinário', '6.8', 'pH'),
      u('Proteínas', 'Negativo', ''), u('Glicose', 'Negativo', ''),
      u('Corpos Cetónicos', 'Negativo', ''), u('Urobilinogénio', 'Normal', ''),
      ph('ecg', 'Ritmo Cardíaco', '68', 'bpm'), ph('ppg', 'SpO2', '98', '%'),
      ph('ppg', 'HRV Estimada', '52', 'ms'), ph('temp', 'Temperatura', '36.6', '°C'),
      ph('weight', 'Peso', '72.0', 'kg'), fecal('Bristol', 'Tipo 4 — Ideal'),
      fecal('Frequência', '1× por dia'),
    ],
    ecosystemFacts: [
      eco('sleep_duration_logged', '7h 12m', 'deep_sleep'),
      eco('hydration_goal_met', '2.1 L', '_hydra'),
      eco('meal_plan_followed', 'Refeições equilibradas', 'nutri-menu'),
    ],
  },

  low_energy: {
    measurements: [
      u('Gravidade Específica', '1.030', 'sg'), u('pH Urinário', '5.5', 'pH'),
      u('Proteínas', 'Negativo', ''), u('Glicose', 'Negativo', ''),
      u('Corpos Cetónicos', 'Positivo (+)', ''), u('Urobilinogénio', 'Elevado', ''),
      u('Cortisol Urinário', 'Elevado', ''),
      ph('ecg', 'Ritmo Cardíaco', '84', 'bpm'), ph('ppg', 'SpO2', '96', '%'),
      ph('temp', 'Temperatura', '36.2', '°C'), ph('weight', 'Peso', '71.2', 'kg'),
      fecal('Bristol', 'Tipo 6 — Mole'), fecal('Frequência', '2× por dia'),
    ],
    ecosystemFacts: [
      eco('sleep_duration_logged', '5h 20m', 'deep_sleep'),
      eco('caloric_deficit_logged', 'Défice calórico registado', 'nutri-menu'),
    ],
  },

  poor_recovery: {
    measurements: [
      u('Gravidade Específica', '1.025', 'sg'), u('pH Urinário', '5.8', 'pH'),
      u('Proteínas', 'Traços (+/-)', ''), u('Glicose', 'Negativo', ''),
      u('Corpos Cetónicos', 'Negativo', ''), u('Urobilinogénio', 'Normal', ''),
      ph('ecg', 'Ritmo Cardíaco', '76', 'bpm'), ph('ppg', 'HRV Estimada', '28', 'ms'),
      ph('ppg', 'SpO2', '97', '%'), ph('temp', 'Temperatura', '36.9', '°C'),
      ph('weight', 'Peso', '75.3', 'kg'),
      fecal('Bristol', 'Tipo 3 — Duro'), fecal('Frequência', '1× em 2 dias'),
    ],
    ecosystemFacts: [
      eco('hrv_suppressed', 'HRV suprimida — 28ms', 'deep_sleep'),
      eco('intense_training_logged', 'Treino intenso registado', '_motion'),
      eco('sleep_duration_logged', '6h 10m', 'deep_sleep'),
    ],
  },

  irregular_digestion: {
    measurements: [
      u('Gravidade Específica', '1.018', 'sg'), u('pH Urinário', '7.2', 'pH'),
      u('Proteínas', 'Negativo', ''), u('Glicose', 'Negativo', ''),
      u('Urobilinogénio', 'Elevado', ''), u('Bilirrubina', 'Traços (+/-)', ''),
      ph('ecg', 'Ritmo Cardíaco', '71', 'bpm'), ph('ppg', 'SpO2', '97', '%'),
      ph('temp', 'Temperatura', '37.1', '°C'), ph('weight', 'Peso', '73.8', 'kg'),
      fecal('Bristol', 'Tipo 5 — Mole'), fecal('Frequência', '3× por dia'),
    ],
    ecosystemFacts: [
      eco('late_meal_logged', 'Refeição pesada às 23h00', 'nutri-menu'),
      eco('fasting_cycle_broken', 'Ciclo de jejum interrompido', '_fasting'),
    ],
  },

  unstable_rhythm: {
    measurements: [
      u('Gravidade Específica', '1.022', 'sg'), u('pH Urinário', '6.2', 'pH'),
      u('Proteínas', 'Negativo', ''), u('Glicose', 'Negativo', ''),
      u('Cortisol Urinário', 'Elevado', ''), u('Urobilinogénio', 'Normal', ''),
      ph('ecg', 'Ritmo Cardíaco', '79', 'bpm'), ph('ppg', 'HRV Estimada', '35', 'ms'),
      ph('ppg', 'SpO2', '97', '%'), ph('temp', 'Temperatura', '36.4', '°C'),
      ph('weight', 'Peso', '72.5', 'kg'),
      fecal('Bristol', 'Tipo 4 — Ideal'), fecal('Frequência', '1× por dia'),
    ],
    ecosystemFacts: [
      eco('late_bedtime_logged', 'Hora de deitar: 02h30', 'deep_sleep'),
      eco('fasting_cycle_broken', 'Jejum com horários irregulares', '_fasting'),
      eco('sleep_duration_logged', '6h 30m', 'deep_sleep'),
    ],
  },

  mixed: {
    measurements: [
      u('Gravidade Específica', '1.021', 'sg'), u('pH Urinário', '6.5', 'pH'),
      u('Proteínas', 'Negativo', ''), u('Glicose', 'Negativo', ''),
      u('Corpos Cetónicos', 'Negativo', ''), u('Urobilinogénio', 'Normal', ''),
      ph('ecg', 'Ritmo Cardíaco', '66', 'bpm'), ph('ppg', 'SpO2', '97', '%'),
      ph('ppg', 'HRV Estimada', '48', 'ms'), ph('temp', 'Temperatura', '36.7', '°C'),
      ph('weight', 'Peso', '74.1', 'kg'),
      fecal('Bristol', 'Tipo 4 — Ideal'), fecal('Frequência', '1× por dia'),
    ],
    ecosystemFacts: [
      eco('cardio_session_logged', 'Cardio 35 min', '_cardio'),
      eco('high_protein_intake', 'Proteína alta registada', 'nutri-menu'),
      eco('sleep_duration_logged', '6h 48m', 'deep_sleep'),
    ],
  },
};

// ── API pública ────────────────────────────────────────────────────────────────

export function getDemoMeasurements(key: DemoScenarioKey): AnalysisMeasurement[] {
  return SCENARIOS_DATA[key].measurements;
}

export function getDemoEcosystemFacts(key: DemoScenarioKey): AnalysisEvent[] {
  return SCENARIOS_DATA[key].ecosystemFacts;
}

/**
 * Cria um objecto Analysis completo para modo Demo.
 * source: 'demo' — nunca contaminará o histórico real.
 */
export function createDemoAnalysis(key: DemoScenarioKey): Analysis {
  const data = SCENARIOS_DATA[key];
  return {
    id: `demo_${key}_${Date.now()}`,
    label: DEMO_LABELS[key],
    analysisDate: '2026-04-02',
    source: 'demo',
    demoScenarioKey: key,
    measurements: data.measurements,
    ecosystemFacts: data.ecosystemFacts,
    createdAt: new Date().toISOString(),
  };
}

export const DEMO_LABELS: Record<DemoScenarioKey, string> = {
  balanced:             'Equilíbrio Geral',
  low_energy:           'Energia em Baixo',
  poor_recovery:        'Recuperação Lenta',
  irregular_digestion:  'Digestão Irregular',
  unstable_rhythm:      'Ritmo Instável',
  mixed:                'Perfil Misto',
};

/**
 * DEMO_SCENARIOS: compatibilidade retroactiva com updateTemporalContext.
 * Cada acesso computa o bundle via analysis-engine (não é preescrito).
 */
export const DEMO_SCENARIOS: Record<DemoScenarioKey, SemanticOutputState> =
  new Proxy({} as Record<DemoScenarioKey, SemanticOutputState>, {
    get(_t, key: string) {
      const data = SCENARIOS_DATA[key as DemoScenarioKey];
      if (!data) return undefined;
      return computeSemanticFromMeasurements(data.measurements, data.ecosystemFacts);
    },
  });

/** @deprecated Usar createDemoAnalysis + semanticOutputService.loadAnalysis */
export function computeSemanticFromDemo(key: DemoScenarioKey): SemanticOutputState {
  const data = SCENARIOS_DATA[key];
  return computeSemanticFromMeasurements(data.measurements, data.ecosystemFacts);
}

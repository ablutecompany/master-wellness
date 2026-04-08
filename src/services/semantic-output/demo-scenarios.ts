import { SemanticOutputState, SemanticDomainView } from './types';

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export type DemoScenarioKey =
  | 'balanced'
  | 'low_energy'
  | 'poor_recovery'
  | 'irregular_digestion'
  | 'unstable_rhythm'
  | 'mixed';

/**
 * Biomarcadores que a UI suporta por categoria:
 *
 * URINA (type: 'urinalysis', value.marker):
 *   - 'Gravidade Específica'   [sg]       → hidratação
 *   - 'pH Urinário'            [pH]       → equilíbrio ácido-base
 *   - 'Proteínas'              ['Negativo'|'Traços (+/-)'|'Positivo (+)']
 *   - 'Glicose'                ['Negativo'|'Positivo (+)']
 *   - 'Corpos Cetónicos'       ['Negativo'|'Positivo (+)']
 *   - 'Urobilinogénio'         ['Normal'|'Elevado']
 *   - 'Bilirrubina'            ['Negativo'|'Traços (+/-)']
 *   - 'Cortisol Urinário'      ['Normal'|'Elevado']      (proxy metabólico)
 *
 * FISIOLÓGICA (types: 'ecg', 'ppg', 'temp', 'weight'):
 *   - ecg  → 'Ritmo Cardíaco'   [bpm]
 *   - ppg  → 'HRV Estimada'     [ms]   OR  'SpO2'  [%]
 *   - temp → 'Temperatura'      [°C]
 *   - weight → 'Peso'           [kg]
 *
 * FECAL (type: 'fecal', value.marker):
 *   Apenas campos clinicamente observáveis/suportados pelo modelo real:
 *   - 'Bristol'      [string]  → ex: 'Tipo 4 — Ideal'
 *   - 'Frequência'   [string]  → ex: '1× por dia'
 *
 * ECOSSISTEMA (DemoEcosystemFact[]):
 *   - sleep_duration_logged   → horas de sono registadas
 *   - hrv_suppressed          → HRV suprimida (de app third-party)
 *   - hydration_goal_met      → meta de hidratação cumprida
 *   - late_meal_logged        → refeição tardia
 *   - intense_training_logged → sessão de treino intensa
 *   - fasting_cycle_broken    → jejum interrompido
 *   - late_bedtime_logged     → hora de deitar tardia
 *   - caloric_deficit_logged  → défice calórico
 *   - high_protein_intake     → proteína alta
 *   - cardio_session_logged   → sessão de cardio
 */

export interface DemoMeasurement {
  type: 'urinalysis' | 'ecg' | 'ppg' | 'temp' | 'weight' | 'fecal';
  timestamp: string;
  value: { marker?: string; value: string; unit: string; displayValue?: string };
}

export interface DemoEcosystemFact {
  id: string;
  type: string;
  value: string;
  sourceAppId: string;
  domain: string;
  derivedFromEventIds: string[];
  createdAt: number;
  validFrom: number;
  validUntil: number;
  status: 'active';
}

/** Fonte única de verdade para um cenário demo */
export interface DemoAnalysis {
  scenarioKey: DemoScenarioKey;
  measurements: DemoMeasurement[];
  ecosystemFacts: DemoEcosystemFact[];
  // semanticBundle é CALCULADO a partir dos dois campos acima — não hardcoded
}

// ── Helpers de construção ───────────────────────────────────────────────────────
const TS = '2026-04-02T08:00:00Z';
const FAR = 9999999999999;

function u(marker: string, value: string, unit: string): DemoMeasurement {
  return { type: 'urinalysis', timestamp: TS, value: { marker, value, unit } };
}
function ph(type: 'ecg' | 'ppg' | 'temp' | 'weight', marker: string, value: string, unit: string): DemoMeasurement {
  return { type, timestamp: TS, value: { marker, value, unit } };
}
function fecal(marker: string, value: string): DemoMeasurement {
  return { type: 'fecal', timestamp: TS, value: { marker, value, unit: '' } };
}
function eco(type: string, value: string, sourceAppId: string, idx: number): DemoEcosystemFact {
  return {
    id: `demo_eco_${idx}`,
    type, value, sourceAppId,
    domain: 'general',
    derivedFromEventIds: [`demo_evt_${idx}`],
    createdAt: Date.now(),
    validFrom: Date.now() - 1000,
    validUntil: FAR,
    status: 'active',
  };
}

// ── 6 CENÁRIOS — apenas biomarcadores, sem narrativa hardcoded ─────────────────

const SCENARIOS_MAP: Record<DemoScenarioKey, DemoAnalysis> = {

  balanced: {
    scenarioKey: 'balanced',
    measurements: [
      u('Gravidade Específica', '1.020', 'sg'),
      u('pH Urinário', '6.8', 'pH'),
      u('Proteínas', 'Negativo', ''),
      u('Glicose', 'Negativo', ''),
      u('Corpos Cetónicos', 'Negativo', ''),
      u('Urobilinogénio', 'Normal', ''),
      ph('ecg', 'Ritmo Cardíaco', '68', 'bpm'),
      ph('ppg', 'SpO2', '98', '%'),
      ph('ppg', 'HRV Estimada', '52', 'ms'),
      ph('temp', 'Temperatura', '36.6', '°C'),
      ph('weight', 'Peso', '72.0', 'kg'),
      fecal('Bristol', 'Tipo 4 — Ideal'),
      fecal('Frequência', '1× por dia'),
    ],
    ecosystemFacts: [
      eco('sleep_duration_logged', '7h 12m', 'deep_sleep', 0),
      eco('hydration_goal_met', '2.1 L', '_hydra', 1),
      eco('meal_plan_followed', 'Refeições equilibradas', 'nutri-menu', 2),
    ],
  },

  low_energy: {
    scenarioKey: 'low_energy',
    measurements: [
      u('Gravidade Específica', '1.030', 'sg'),
      u('pH Urinário', '5.5', 'pH'),
      u('Proteínas', 'Negativo', ''),
      u('Glicose', 'Negativo', ''),
      u('Corpos Cetónicos', 'Positivo (+)', ''),
      u('Urobilinogénio', 'Elevado', ''),
      u('Cortisol Urinário', 'Elevado', ''),
      ph('ecg', 'Ritmo Cardíaco', '84', 'bpm'),
      ph('ppg', 'SpO2', '96', '%'),
      ph('temp', 'Temperatura', '36.2', '°C'),
      ph('weight', 'Peso', '71.2', 'kg'),
      fecal('Bristol', 'Tipo 6 — Mole'),
      fecal('Frequência', '2× por dia'),
    ],
    ecosystemFacts: [
      eco('sleep_duration_logged', '5h 20m', 'deep_sleep', 0),
      eco('caloric_deficit_logged', 'Défice calórico registado', 'nutri-menu', 1),
      eco('fatigue_context_added', 'Fadiga matinal elevada', 'deep_sleep', 2),
    ],
  },

  poor_recovery: {
    scenarioKey: 'poor_recovery',
    measurements: [
      u('Gravidade Específica', '1.025', 'sg'),
      u('pH Urinário', '5.8', 'pH'),
      u('Proteínas', 'Traços (+/-)', ''),
      u('Glicose', 'Negativo', ''),
      u('Corpos Cetónicos', 'Negativo', ''),
      u('Urobilinogénio', 'Normal', ''),
      ph('ecg', 'Ritmo Cardíaco', '76', 'bpm'),
      ph('ppg', 'HRV Estimada', '28', 'ms'),
      ph('ppg', 'SpO2', '97', '%'),
      ph('temp', 'Temperatura', '36.9', '°C'),
      ph('weight', 'Peso', '75.3', 'kg'),
      fecal('Bristol', 'Tipo 3 — Duro'),
      fecal('Frequência', '1× em 2 dias'),
    ],
    ecosystemFacts: [
      eco('hrv_suppressed', 'HRV suprimida — 28ms', 'deep_sleep', 0),
      eco('intense_training_logged', 'Treino intenso registado', '_motion', 1),
      eco('sleep_duration_logged', '6h 10m', 'deep_sleep', 2),
    ],
  },

  irregular_digestion: {
    scenarioKey: 'irregular_digestion',
    measurements: [
      u('Gravidade Específica', '1.018', 'sg'),
      u('pH Urinário', '7.2', 'pH'),
      u('Proteínas', 'Negativo', ''),
      u('Glicose', 'Negativo', ''),
      u('Urobilinogénio', 'Elevado', ''),
      u('Bilirrubina', 'Traços (+/-)', ''),
      ph('ecg', 'Ritmo Cardíaco', '71', 'bpm'),
      ph('ppg', 'SpO2', '97', '%'),
      ph('temp', 'Temperatura', '37.1', '°C'),
      ph('weight', 'Peso', '73.8', 'kg'),
      fecal('Bristol', 'Tipo 5 — Mole'),
      fecal('Frequência', '3× por dia'),
    ],
    ecosystemFacts: [
      eco('late_meal_logged', 'Refeição pesada às 23h00', 'nutri-menu', 0),
      eco('fasting_cycle_broken', 'Ciclo de jejum interrompido', '_fasting', 1),
    ],
  },

  unstable_rhythm: {
    scenarioKey: 'unstable_rhythm',
    measurements: [
      u('Gravidade Específica', '1.022', 'sg'),
      u('pH Urinário', '6.2', 'pH'),
      u('Proteínas', 'Negativo', ''),
      u('Glicose', 'Negativo', ''),
      u('Cortisol Urinário', 'Elevado', ''),
      u('Urobilinogénio', 'Normal', ''),
      ph('ecg', 'Ritmo Cardíaco', '79', 'bpm'),
      ph('ppg', 'HRV Estimada', '35', 'ms'),
      ph('ppg', 'SpO2', '97', '%'),
      ph('temp', 'Temperatura', '36.4', '°C'),
      ph('weight', 'Peso', '72.5', 'kg'),
      fecal('Bristol', 'Tipo 4 — Ideal'),
      fecal('Frequência', '1× por dia'),
    ],
    ecosystemFacts: [
      eco('late_bedtime_logged', 'Hora de deitar: 02h30', 'deep_sleep', 0),
      eco('fasting_cycle_broken', 'Jejum com horários irregulares', '_fasting', 1),
      eco('sleep_duration_logged', '6h 30m', 'deep_sleep', 2),
    ],
  },

  mixed: {
    scenarioKey: 'mixed',
    measurements: [
      u('Gravidade Específica', '1.021', 'sg'),
      u('pH Urinário', '6.5', 'pH'),
      u('Proteínas', 'Negativo', ''),
      u('Glicose', 'Negativo', ''),
      u('Corpos Cetónicos', 'Negativo', ''),
      u('Urobilinogénio', 'Normal', ''),
      ph('ecg', 'Ritmo Cardíaco', '66', 'bpm'),
      ph('ppg', 'SpO2', '97', '%'),
      ph('ppg', 'HRV Estimada', '48', 'ms'),
      ph('temp', 'Temperatura', '36.7', '°C'),
      ph('weight', 'Peso', '74.1', 'kg'),
      fecal('Bristol', 'Tipo 4 — Ideal'),
      fecal('Frequência', '1× por dia'),
    ],
    ecosystemFacts: [
      eco('cardio_session_logged', 'Cardio 35 min', '_cardio', 0),
      eco('high_protein_intake', 'Proteína alta registada', 'nutri-menu', 1),
      eco('sleep_duration_logged', '6h 48m', 'deep_sleep', 2),
    ],
  },
};

// ── Motor de cálculo semântico — causalidade real dos biomarcadores ─────────────

/** Helpers */
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function lerp(v: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}
function score01(v: number, inMin: number, inMax: number) {
  return clamp(lerp(v, inMin, inMax, 0, 100), 0, 100);
}
function band(s: number): 'optimal' | 'fair' | 'poor' {
  return s >= 78 ? 'optimal' : s >= 55 ? 'fair' : 'poor';
}

function getMeasurement(ms: DemoMeasurement[], type: string, marker?: string): string {
  return ms.find(m => m.type === type && (!marker || m.value.marker === marker))?.value.value ?? '';
}
function getSleepHours(facts: DemoEcosystemFact[]): number {
  const f = facts.find(f => f.type === 'sleep_duration_logged');
  if (!f) return 0;
  const match = f.value.match(/(\d+)h\s*(\d+)?m?/);
  if (!match) return 0;
  return parseInt(match[1]) + (parseInt(match[2] || '0') / 60);
}

function buildDomain(
  domain: string, score: number, statusLabel: string,
  b: 'optimal' | 'fair' | 'poor', summary: string, description: string,
  recs: Array<{ title: string; actionable: string }>
): SemanticDomainView {
  return {
    domain, label: domain, score,
    status: 'sufficient_data', statusLabel, band: b,
    generatedAt: Date.now(), lastComputedAt: Date.now(), isStale: false, version: '1.2.0',
    mainInsight: { id: `insight_${domain}`, summary, description, tone: 'informative', factors: [] },
    recommendations: recs.map((r, i) => ({
      id: `rec_${domain}_${i}`, title: r.title, actionable: r.actionable, impact: 'médio', effort: 'baixo'
    })) as any
  };
}

/**
 * Motor de cálculo semântico — converte biomarcadores demo em interpretação AI.
 * Cada domínio deriva o score e o texto diretamente dos valores medidos.
 * Não há narrativa hardcoded — muda os valores, muda a leitura.
 */
export function computeSemanticFromDemo(key: DemoScenarioKey): SemanticOutputState {
  const { measurements: ms, ecosystemFacts: eco } = SCENARIOS_MAP[key];

  // ── Extração de valores medidos ──────────────────────────────────────────────
  const hr = parseFloat(getMeasurement(ms, 'ecg', 'Ritmo Cardíaco') || '0');
  const hrv = parseFloat(getMeasurement(ms, 'ppg', 'HRV Estimada') || '0');
  const spo2 = parseFloat(getMeasurement(ms, 'ppg', 'SpO2') || '0');
  const temp = parseFloat(getMeasurement(ms, 'temp', 'Temperatura') || '0');
  const gravidade = parseFloat(getMeasurement(ms, 'urinalysis', 'Gravidade Específica') || '0');
  const phUrinary = parseFloat(getMeasurement(ms, 'urinalysis', 'pH Urinário') || '7');
  const proteinas = getMeasurement(ms, 'urinalysis', 'Proteínas');
  const glucose = getMeasurement(ms, 'urinalysis', 'Glicose');
  const cetones = getMeasurement(ms, 'urinalysis', 'Corpos Cetónicos');
  const urobilinogenio = getMeasurement(ms, 'urinalysis', 'Urobilinogénio');
  const cortisol = getMeasurement(ms, 'urinalysis', 'Cortisol Urinário');
  const bristol = getMeasurement(ms, 'fecal', 'Bristol');
  const sleepH = getSleepHours(eco);

  const hasHRV = hrv > 0;
  const hasSleep = sleepH > 0;
  const isDehydrated = gravidade > 1.027;
  const isAcidUrine = phUrinary < 6.0;
  const hasProtein = proteinas.includes('Traços') || proteinas.includes('Positivo');
  const hasGlucose = glucose.includes('Positivo');
  const hasKetones = cetones.includes('Positivo');
  const highUrobi = urobilinogenio.includes('Elevado');
  const highCortisol = cortisol.includes('Elevado');
  const bristolNum = parseInt(bristol.match(/\d+/)?.[0] || '4');
  const goodBristol = bristolNum === 3 || bristolNum === 4 || bristolNum === 5;
  const badBristol = bristolNum <= 2 || bristolNum >= 6;

  // ── SLEEP ────────────────────────────────────────────────────────────────────
  const sleepScore = (() => {
    let s = hasSleep ? score01(sleepH, 4, 9) : 50;
    if (hasHRV) s = s * 0.6 + score01(hrv, 15, 65) * 0.4;
    if (highCortisol) s -= 15;
    return Math.round(clamp(s, 0, 100));
  })();
  const sleepLabel = sleepScore >= 78 ? 'Restaurador' : sleepScore >= 55 ? 'Moderado' : 'Insuficiente';
  const sleepSummary = hasSleep
    ? sleepH >= 7.5 ? `Sono profundo — ${(sleepH).toFixed(1).replace('.', 'h')} registadas`
    : sleepH >= 6 ? `Sono moderado — ${(sleepH).toFixed(1).replace('.', 'h')} registadas`
    : `Sono reduzido — apenas ${(sleepH).toFixed(1).replace('.', 'h')} registadas`
    : 'Duração de sono não registada';
  const sleepDesc = [
    hasHRV && hrv < 35 ? `HRV em ${hrv}ms indica dominância simpática residual.` : null,
    hasHRV && hrv >= 50 ? `HRV em ${hrv}ms confirma recuperação parassimpática eficaz.` : null,
    highCortisol ? 'Cortisol urinário elevado aponta para activação tardia do eixo HPA.' : null,
    hasSleep && sleepH < 6 ? 'Abaixo das 6 horas, a consolidação de memória e regeneração celular ficam comprometidas.' : null,
    !hasSleep ? 'Sincronize uma app de sono para obter interpretação aprofundada.' : null,
  ].filter(Boolean).join(' ') || 'Parâmetros dentro dos limites esperados.';

  // ── NUTRITION ────────────────────────────────────────────────────────────────
  const nutritionScore = (() => {
    let s = 80;
    if (hasGlucose) s -= 30;
    if (hasKetones) s -= 20;
    if (highUrobi) s -= 15;
    if (isDehydrated) s -= 10;
    if (hasProtein) s -= 5;
    return Math.round(clamp(s, 0, 100));
  })();
  const nutritionLabel = nutritionScore >= 78 ? 'Equilibrado' : nutritionScore >= 55 ? 'Com Atenção' : 'Défice Ativo';
  const nutritionSummary = hasGlucose ? 'Glicosúria detetada — excesso glicémico'
    : hasKetones ? 'Corpos cetónicos positivos — estado de défice calórico'
    : highUrobi ? 'Urobilinogénio elevado — sobrecarga hepática metabólica'
    : 'Perfil urinário sem marcadores de stress glicémico ou cetónico';
  const nutritionDesc = [
    hasGlucose ? `Glicose urinária positiva indica sobrecarga glicémica aguda.` : null,
    hasKetones ? `Corpos cetónicos positivos — o organismo recorre às reservas de gordura por défice calórico.` : null,
    highUrobi ? `Urobilinogénio elevado pode indicar sobrecarga hepática ou hemólise residual.` : null,
    !hasGlucose && !hasKetones && !highUrobi ? `Glicose e proteínas negativas — sinalização metabólica estável.` : null,
    isDehydrated ? `Gravidade específica de ${gravidade} — ingestão de líquidos abaixo do ideal.` : null,
  ].filter(Boolean).join(' ') || 'Parâmetros metabólicos dentro dos valores de referência.';

  // ── GENERAL ──────────────────────────────────────────────────────────────────
  const generalScore = (() => {
    const hrS = hr > 0 ? score01(hr, 100, 55) : 70;  // inverso: HR baixo = melhor
    const spo2S = spo2 > 0 ? score01(spo2, 92, 100) : 80;
    const tempS = temp > 0 ? (temp >= 36.1 && temp <= 37.2 ? 100 : temp <= 37.5 ? 70 : 40) : 75;
    const hydS = isDehydrated ? 50 : gravidade < 1.005 ? 60 : 90;
    let s = hrS * 0.35 + spo2S * 0.35 + tempS * 0.2 + hydS * 0.1;
    if (hasProtein) s -= 8;
    return Math.round(clamp(s, 0, 100));
  })();
  const generalLabel = generalScore >= 78 ? 'Homeostase' : generalScore >= 55 ? 'Estável' : 'Sob Pressão';
  const generalSummary = spo2 >= 98 && hr <= 70 ? `Sistema cardiovascular em pico — SpO2 ${spo2}%, HR ${hr} bpm`
    : temp > 37.2 ? `Temperatura elevada (${temp}°C) — sinal inflamatório activo`
    : hr > 85 ? `Taquicardia de repouso (${hr} bpm) — sistema sob carga`
    : `Leituras cardiovasculares e sistémicas no intervalo funcional`;
  const generalDesc = [
    spo2 > 0 ? `SpO2 em ${spo2}% — ${spo2 >= 98 ? 'oxigenação óptima' : spo2 >= 95 ? 'adequada' : 'ligeiramente reduzida'}.` : null,
    hr > 0 ? `Ritmo cardíaco em repouso de ${hr} bpm — ${hr <= 65 ? 'excelente adaptação aeróbia' : hr <= 75 ? 'dentro do normal' : 'ligeiramente elevado'}.` : null,
    temp > 0 ? `Temperatura basal de ${temp}°C — ${temp <= 37.0 ? 'sem sinais inflamatórios' : 'possível reação inflamatória active'}.` : null,
    isDehydrated ? `Gravidade urinária de ${gravidade} acusa desidratação — aumentar ingestão de líquidos.` : null,
  ].filter(Boolean).join(' ') || 'Parâmetros gerais dentro dos limites esperados.';

  // ── ENERGY ───────────────────────────────────────────────────────────────────
  const energyScore = (() => {
    const hrS = hr > 0 ? score01(hr, 100, 55) : 70;
    const sleepS = hasSleep ? score01(sleepH, 3, 9) : 55;
    const cetonesP = hasKetones ? -20 : 0;
    const cortisolP = highCortisol ? -15 : 0;
    const urobi = highUrobi ? -10 : 0;
    let s = hrS * 0.45 + sleepS * 0.45 + 10 + cetonesP + cortisolP + urobi;
    return Math.round(clamp(s, 0, 100));
  })();
  const energyLabel = energyScore >= 78 ? 'Elevada' : energyScore >= 55 ? 'Moderada' : 'Em Baixo';
  const energySummary = hr > 85 ? `Frequência cardíaca elevada (${hr} bpm) — sistema sobre ativação adrenérgica`
    : hasKetones ? 'Cetose ativa — energia proveniente de reservas lipídicas'
    : hasSleep && sleepH < 6 ? `Recarregamento incompleto — ${(sleepH).toFixed(1).replace('.', 'h')} de sono`
    : `Capacidade energética funcional detectada`;
  const energyDesc = [
    hasSleep && sleepH >= 7 ? `${(sleepH).toFixed(1).replace('.', 'h')} de sono garantem reservas energéticas reposta.` : null,
    hasSleep && sleepH < 6 ? `Apenas ${(sleepH).toFixed(1).replace('.', 'h')} de sono — capacidade de trabalho cognitivo e físico reduzida.` : null,
    hasKetones ? 'Corpos cetónicos positivos indicam utilização de gordura como substrato energético principal.' : null,
    highCortisol ? 'Cortisol elevado gera energia artificial de curto prazo com custo metabólico elevado.' : null,
    hr > 80 ? `HR de ${hr} bpm em repouso acusa elevada demanda simpática.` : null,
  ].filter(Boolean).join(' ') || 'Parâmetros energéticos dentro dos valores funcionais.';

  // ── RECOVERY ─────────────────────────────────────────────────────────────────
  const recoveryScore = (() => {
    const hrvS = hasHRV ? score01(hrv, 15, 65) : 60;
    const bristolS = goodBristol ? 90 : badBristol ? 45 : 70;
    const tempS = temp > 37.2 ? 50 : 90;
    const proteinP = hasProtein ? -10 : 0;
    let s = hrvS * 0.55 + bristolS * 0.25 + tempS * 0.2 + proteinP;
    return Math.round(clamp(s, 0, 100));
  })();
  const recoveryLabel = recoveryScore >= 78 ? 'Completa' : recoveryScore >= 55 ? 'Parcial' : 'Insuficiente';
  const recoverySummary = hasHRV && hrv < 30 ? `HRV crítica (${hrv}ms) — recuperação autonómica comprometida`
    : hasHRV && hrv >= 50 ? `HRV elevada (${hrv}ms) — recuperação autonómica eficaz`
    : badBristol ? `Trânsito intestinal alterado (${bristol}) — absorção e recuperação lentas`
    : `Capacidade de recuperação funcional`;
  const recoveryDesc = [
    hasHRV ? `HRV estimada em ${hrv}ms — ${hrv >= 50 ? 'sistema nervoso parassimpático dominante, recuperação eficaz' : hrv >= 30 ? 'recuperação em curso, sistema ainda reactivo' : 'dominância simpática residual, descanso adicional necessário'}.` : 'HRV não registada — sincronize app de sono para avaliação autonómica.',
    bristolNum !== 4 ? `Bristol ${bristolNum} — ${badBristol ? 'trânsito alterado, absorção de nutrientes comprometida' : 'trânsito ligeiramente irregular'}.` : 'Bristol Tipo 4 — trânsito intestinal ideal, absorção óptima.',
    hasProtein ? 'Proteínas em traços — indicador de reparação muscular activa pós-esforço.' : null,
    temp > 37.2 ? 'Temperatura elevada — resposta inflamatória a limitar recuperação celular.' : null,
  ].filter(Boolean).join(' ') || 'Indicadores de recuperação dentro dos limites funcionais.';

  // ── PERFORMANCE ───────────────────────────────────────────────────────────────
  const performanceScore = (() => {
    const base = (sleepScore + energyScore + recoveryScore + generalScore) / 4;
    const hrBonus = hr <= 65 ? 8 : hr <= 75 ? 3 : -5;
    const spo2Bonus = spo2 >= 98 ? 5 : spo2 >= 95 ? 0 : -8;
    return Math.round(clamp(base + hrBonus + spo2Bonus, 0, 100));
  })();
  const performanceLabel = performanceScore >= 78 ? 'Pico' : performanceScore >= 55 ? 'Funcional' : 'Limitada';
  const performanceSummary = performanceScore >= 78 ? 'Prontidão sistémica elevada — condições óptimas para desempenho'
    : performanceScore >= 55 ? 'Prontidão funcional — desempenho preservado com reservas moderadas'
    : 'Prontidão comprometida — esforço de pico desaconselhado hoje';
  const performanceDesc = [
    `Score composto: Sono ${sleepScore}, Energia ${energyScore}, Recuperação ${recoveryScore}, Geral ${generalScore}.`,
    performanceScore >= 78 ? 'Todos os sistemas biológicos apontam para capacidade máxima de desempenho.' : null,
    performanceScore < 55 ? 'Risco elevado de fadiga ou lesão se esforço de alta intensidade hoje.' : null,
    spo2 > 0 && spo2 < 96 ? `SpO2 de ${spo2}% pode limitar capacidade aeróbia máxima.` : null,
  ].filter(Boolean).join(' ');

  // ── Construção do bundle final ────────────────────────────────────────────────
  const crossSummary = [
    `Cenário: ${key.replace(/_/g, ' ')}.`,
    `Sono ${sleepLabel.toLowerCase()} (${sleepScore}/100), energia ${energyLabel.toLowerCase()} (${energyScore}/100), recuperação ${recoveryLabel.toLowerCase()} (${recoveryScore}/100).`,
    sleepScore < 60 || energyScore < 60 || recoveryScore < 60 ? 'Sinais de atenção detetados — priorize repouso e hidratação.' : 'Sistema biológico sem alertas críticos activos.',
  ].join(' ');

  return {
    version: '1.2.0',
    generatedAt: Date.now(),
    status: 'ready',
    isLive: true,
    metadata: {
      lastUpdatedAt: Date.now(),
      lastRequestedAt: Date.now(),
      isDirty: false,
      dirtyDomains: {} as Record<string, boolean>,
      staleAfterMs: 300000,
      retryCount: 0,
      version: '1.2.0',
    },
    crossDomainSummary: {
      summary: crossSummary,
      coherenceFlags: [],
      prioritySignals: [],
      deduplicatedRecommendations: [] as any,
    },
    domains: {
      sleep: buildDomain('sleep', sleepScore, sleepLabel, band(sleepScore), sleepSummary, sleepDesc,
        sleepScore < 60 ? [{ title: 'Aumentar Duração', actionable: 'Deite-se 30 minutos mais cedo durante 5 dias consecutivos.' }] : []),
      nutrition: buildDomain('nutrition', nutritionScore, nutritionLabel, band(nutritionScore), nutritionSummary, nutritionDesc,
        hasKetones ? [{ title: 'Reforçar Aporte', actionable: 'Adicione hidratos complexos à próxima refeição.' }] : []),
      general: buildDomain('general', generalScore, generalLabel, band(generalScore), generalSummary, generalDesc,
        isDehydrated ? [{ title: 'Hidratação', actionable: 'Beba 500ml de água nas próximas 2 horas.' }] : []),
      energy: buildDomain('energy', energyScore, energyLabel, band(energyScore), energySummary, energyDesc,
        energyScore < 55 ? [{ title: 'Pausa Estratégica', actionable: 'Agende 20 min de descanso sem ecrãs ao meio-dia.' }] : []),
      recovery: buildDomain('recovery', recoveryScore, recoveryLabel, band(recoveryScore), recoverySummary, recoveryDesc,
        recoveryScore < 55 ? [{ title: 'Descanso Activo', actionable: 'Substitua treino de força por mobilidade suave hoje.' }] : []),
      performance: buildDomain('performance', performanceScore, performanceLabel, band(performanceScore), performanceSummary, performanceDesc, []),
    },
  } as SemanticOutputState;
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * DEMO_SCENARIOS: mantido apenas para retrocompatibilidade com updateTemporalContext.
 * Internamente, cada bundle é CALCULADO a partir dos biomarcadores — não preescrito.
 */
export const DEMO_SCENARIOS: Record<DemoScenarioKey, SemanticOutputState> =
  new Proxy({} as Record<DemoScenarioKey, SemanticOutputState>, {
    get(_target, key: string) {
      return computeSemanticFromDemo(key as DemoScenarioKey);
    }
  });

export function getDemoMeasurements(key: DemoScenarioKey): DemoMeasurement[] {
  return SCENARIOS_MAP[key].measurements;
}

export function getDemoEcosystemFacts(key: DemoScenarioKey): DemoEcosystemFact[] {
  return SCENARIOS_MAP[key].ecosystemFacts;
}

export function getDemoAnalysis(key: DemoScenarioKey): DemoAnalysis {
  return SCENARIOS_MAP[key];
}

import { SemanticStatus, SemanticDomainView, SemanticRecommendationView, SemanticInsightView } from './types';
import { AnalysisMeasurement, AnalysisEvent } from '../../store/types';

// ── CONTRATO MODULAR PARA FUTURA INTEGRAÇÃO OPENAI ────────────────────────────
export interface AIReading {
  summary: {
    title: string;
    text: string;
    confidence: number;
    mode: 'simulation' | 'real';
  };
  dimensions: Array<{
    id: string;
    label: string;
    score: number;
    explanation: string;
    supportingFacts: string[];
    confidence: number;
  }>;
  priorityActions: Array<{
    title: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
    supportingFacts: string[];
    evidenceStrength: number;
  }>;
  highlightedThemes: Array<{
    id: string;
    title: string;
    explanation: string;
    supportingFacts: string[];
    action?: string;
    limitation?: string;
  }>;
  watchSignals: Array<{
    title: string;
    explanation: string;
    reasonToRepeat: string;
  }>;
  references: {
    usedDataFamilies: string[];
    usedSignals: string[];
    freshness: 'recent' | 'caution' | 'stale' | 'unavailable';
    origins: string[];
    confidence: 'high' | 'medium' | 'low';
    limitations: string[];
  };
  readingLimits: string[];
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function score01(v: number, inMin: number, inMax: number) { return clamp(((v - inMin) / (inMax - inMin)) * 100, 0, 100); }

function getMeasurement(ms: AnalysisMeasurement[], type: string, marker?: string): string {
  const val = ms.find(m => m.type === type && (!marker || m.marker === marker))?.value;
  return val !== undefined && val !== null ? String(val) : '';
}

function getSleepHours(facts: AnalysisEvent[]): number {
  const f = facts.find(f => f.type === 'sleep_duration_logged' || f.type === 'sono_profundo');
  if (!f) return 0;
  const raw = String(f.value ?? '');
  const match = String(raw).match(/(\d+)h\s*(\d+)?/);
  if (!match) return 0;
  return parseInt(match[1]) + (parseInt(match[2] || '0') / 60);
}

// ── MOTOR DE CÁLCULO E TRADUÇÃO SEMÂNTICA ─────────────────────────────────────

export function computeAIReadingFromData(
  measurements: AnalysisMeasurement[],
  ecosystemFacts: AnalysisEvent[],
  isDemo: boolean
): AIReading {
  const now = Date.now();
  
  // 1. Extrair Biomarcadores
  const hr = parseFloat(getMeasurement(measurements, 'ecg', 'Ritmo Cardíaco') || '0');
  const hrv = parseFloat(getMeasurement(measurements, 'ppg', 'HRV Estimada') || '0');
  const temp = parseFloat(getMeasurement(measurements, 'temp', 'Temperatura') || '0');
  const gravidade = parseFloat(getMeasurement(measurements, 'urinalysis', 'Gravidade Específica') || '0');
  const bristol = getMeasurement(measurements, 'fecal', 'Bristol');
  const sleepH = getSleepHours(ecosystemFacts);

  const hasData = measurements.length > 0 || ecosystemFacts.length > 0;
  
  // 2. Lógica de Síntese
  let summaryTitle = 'Sinais coerentes entre categorias';
  let summaryText = 'Os seus dados sugerem boa estabilidade geral, com sinais positivos de recuperação e disponibilidade. A principal oportunidade está em manter hidratação regular e acompanhar a consistência nas próximas leituras.';

  if (!hasData) {
    summaryTitle = 'Leitura aguarda dados';
    summaryText = 'Aguardamos a primeira sincronização de sinais para gerar a síntese interpretativa do seu momento biográfico.';
  } else if (isDemo) {
    summaryTitle = 'Simulação: Estabilidade Detetada';
    summaryText = 'Os dados simulados sugerem boa estabilidade geral, com sinais positivos de recuperação e disponibilidade. A principal oportunidade está em manter hidratação regular e acompanhar a consistência nas próximas leituras.';
  }

  // 3. Dimensões
  const energyScore = Math.round(hasData ? 85 : 0);
  const recoveryScore = Math.round(hasData ? 72 : 0);
  const hydrationScore = Math.round(hasData ? score01(gravidade || 1.015, 1.035, 1.005) : 0);
  const digestionScore = Math.round(hasData ? 80 : 0);
  const vitalsScore = Math.round(hasData ? 90 : 0);

  const dimensions: AIReading['dimensions'] = [
    { id: 'energy', label: 'Energia & disponibilidade', score: energyScore, explanation: 'Capacidade de resposta a estímulos físicos e cognitivos.', supportingFacts: ['HRV', 'Sono'], confidence: 0.8 },
    { id: 'recovery', label: 'Recuperação & carga', score: recoveryScore, explanation: 'Eficiência da regeneração celular e parassimpática.', supportingFacts: ['HRV', 'Temperatura'], confidence: 0.75 },
    { id: 'hydration', label: 'Hidratação & equilíbrio urinário', score: hydrationScore, explanation: 'Estado de hidratação celular e filtragem.', supportingFacts: ['Gravidade Específica'], confidence: 0.9 },
    { id: 'digestion', label: 'Estado intestinal', score: digestionScore, explanation: 'Regularidade e qualidade da absorção.', supportingFacts: ['Bristol'], confidence: 0.85 },
    { id: 'vitals', label: 'Sinais vitais & equilíbrio fisiológico', score: vitalsScore, explanation: 'Estabilidade cardiovascular e térmica.', supportingFacts: ['HR', 'SpO2', 'Temperatura'], confidence: 0.95 },
  ].filter(d => hasData);

  // 4. Ações
  const priorityActions: AIReading['priorityActions'] = [];
  if (hasData) {
    if (gravidade > 1.025) {
      priorityActions.push({ title: 'Manter hidratação regular', reason: 'A densidade urinária sugere necessidade de reposição hídrica.', priority: 'high', supportingFacts: ['Gravidade Específica'], evidenceStrength: 0.9 });
    }
    priorityActions.push({ title: 'Reforçar recuperação', reason: 'A variabilidade cardíaca indica oportunidade para repouso ativo.', priority: 'medium', supportingFacts: ['HRV'], evidenceStrength: 0.8 });
    priorityActions.push({ title: 'Apoiar consistência', reason: 'Manter o ritmo de registos ajuda a consolidar a tendência.', priority: 'low', supportingFacts: ['Histórico'], evidenceStrength: 0.7 });
  }

  // 5. Temas
  const highlightedThemes: AIReading['highlightedThemes'] = [];
  if (hasData) {
    highlightedThemes.push({
      id: 'nutrition',
      title: 'Nutrição orientada por sinais',
      explanation: 'As sugestões nutricionais devem partir dos sinais disponíveis, não de uma dieta genérica. Nesta leitura, hidratação, recuperação e estado intestinal têm mais peso do que uma alteração alimentar agressiva.',
      supportingFacts: ['Digestão', 'Hidratação'],
      action: 'Priorizar alimentos hidratantes'
    });
  }

  // 6. Sinais a acompanhar
  const watchSignals: AIReading['watchSignals'] = [];
  if (hasData) {
    watchSignals.push({ title: 'Repetir análise para confirmar tendência', explanation: 'Um ponto isolado não define o seu estado biológico.', reasonToRepeat: 'Validar estabilidade cardiovascular' });
  }

  // 7. Referências
  const families = [];
  if (measurements.some(m => m.type === 'urinalysis')) families.push('Urina');
  if (measurements.some(m => m.type === 'fecal')) families.push('Fezes');
  if (measurements.some(m => ['ecg', 'ppg', 'temp'].includes(m.type))) families.push('Fisiológicos');
  if (ecosystemFacts.length > 0) families.push('Contextuais');

  return {
    summary: { title: summaryTitle, text: summaryText, confidence: 0.85, mode: isDemo ? 'simulation' : 'real' },
    dimensions,
    priorityActions: priorityActions.slice(0, 3),
    highlightedThemes,
    watchSignals,
    references: {
      usedDataFamilies: families,
      usedSignals: measurements.map(m => m.marker || m.type),
      freshness: 'recent',
      origins: isDemo ? ['Simulação'] : ['Medição', 'Contexto'],
      confidence: 'high',
      limitations: isDemo ? ['Modo simulação'] : ['Histórico curto']
    },
    readingLimits: [
      'Esta leitura é interpretativa e deve ser lida em conjunto com os Resultados.',
      'Não substitui avaliação clínica nem faz diagnóstico.',
      'Sinais persistentes, agravamento ou sintomas relevantes devem ser acompanhados por um profissional.'
    ]
  };
}

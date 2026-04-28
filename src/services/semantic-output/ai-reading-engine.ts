import { SemanticStatus, SemanticDomainView, SemanticRecommendationView, SemanticInsightView } from './types';
import { AnalysisMeasurement, AnalysisEvent } from '../../store/types';

// ── CONTRATO MODULAR PARA FUTURA INTEGRAÇÃO OPENAI ────────────────────────────
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
    domain: string;
    evidenceStrength: number;
  }>;
  highlightedThemes: Array<{
    id: string;
    title: string;
    status: 'optimal' | 'caution' | 'insufficient';
    explanation: string;
    supportingFacts: string[];
    action?: string;
    confidence: number;
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
    themeDataLinks: Record<string, string[]>;
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
  const spo2 = parseFloat(getMeasurement(measurements, 'ppg', 'SpO2') || '0');
  const gravidade = parseFloat(getMeasurement(measurements, 'urinalysis', 'Gravidade Específica') || '0');
  const bristol = getMeasurement(measurements, 'fecal', 'Bristol');
  const sleepH = getSleepHours(ecosystemFacts);

  const hasData = measurements.length > 0 || ecosystemFacts.length > 0 || isDemo;
  const hasHRV = hrv > 0 || isDemo;
  const hasSleep = sleepH > 0 || isDemo;
  const hasUrine = measurements.some(m => m.type === 'urinalysis') || isDemo;
  const hasFecal = measurements.some(m => m.type === 'fecal') || isDemo;
  const hasVitals = (hr > 0 || spo2 > 0 || temp > 0) || isDemo;

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

  // 3. Temas (Lógica R2)
  const themes: AIReading['highlightedThemes'] = [];
  const themeDataLinks: Record<string, string[]> = {};

  // T1: Energia & disponibilidade
  if (hasData) {
    const isGood = sleepH >= 7 && hrv >= 40;
    const isBad = sleepH < 6 || (hasHRV && hrv < 30);
    themes.push({
      id: 'energy',
      title: 'Energia & disponibilidade',
      status: isGood ? 'optimal' : isBad ? 'caution' : 'insufficient',
      explanation: isGood 
        ? 'Os dados sugerem boa disponibilidade geral, apoiada por sono suficiente e sinais fisiológicos estáveis. Ainda assim, a leitura ganha mais valor quando comparada com histórico.'
        : 'A disponibilidade energética parece limitada nesta leitura, possivelmente por repouso incompleto ou elevada demanda fisiológica.',
      supportingFacts: ['Sono', 'HRV'],
      action: isGood ? 'Manter rotina' : 'Evitar carga excessiva',
      confidence: 0.8
    });
    themeDataLinks['energy'] = ['ecg', 'ppg', 'sleep_duration_logged'];
  }

  // T2: Recuperação & carga
  if (hasHRV || hasSleep) {
    const recoveryLevel = hrv >= 45 ? 'favorável' : hrv >= 30 ? 'moderada' : 'reduzida';
    themes.push({
      id: 'recovery',
      title: 'Recuperação & carga',
      status: hrv >= 45 ? 'optimal' : 'caution',
      explanation: `A carga recente parece compatível com uma recuperação ${recoveryLevel}. Hoje pode fazer sentido manter intensidade controlada em vez de aumentar o esforço de pico.`,
      supportingFacts: ['HRV', 'Sono'],
      action: hrv < 35 ? 'Priorizar descanso' : 'Manter treino leve',
      confidence: 0.75
    });
    themeDataLinks['recovery'] = ['ppg', 'ecg', 'sleep_duration_logged'];
  }

  // T3: Hidratação & equilíbrio urinário
  if (hasUrine) {
    const isDehydrated = gravidade > 1.025;
    themes.push({
      id: 'hydration',
      title: 'Hidratação & equilíbrio urinário',
      status: isDehydrated ? 'caution' : 'optimal',
      explanation: isDehydrated
        ? 'A leitura sugere necessidade de melhorar a regularidade da hidratação. A densidade urinária e o contexto de atividade foram os sinais com maior peso.'
        : 'A hidratação parece aceitável nesta leitura, com equilíbrio urinário dentro dos parâmetros funcionais.',
      supportingFacts: ['Gravidade Específica'],
      action: 'Distribuir ingestão de água',
      confidence: 0.9
    });
    themeDataLinks['hydration'] = ['urinalysis'];
  }

  // T4: Estado intestinal
  if (hasFecal) {
    themes.push({
      id: 'gut',
      title: 'Estado intestinal',
      status: 'optimal',
      explanation: 'O registo intestinal sugere boa regularidade nesta leitura. O valor principal está em acompanhar se este padrão se mantém ao longo do tempo.',
      supportingFacts: ['Bristol'],
      action: 'Observar consistência',
      confidence: 0.85
    });
    themeDataLinks['gut'] = ['fecal'];
  }

  // T5: Sinais vitais & equilíbrio fisiológico
  if (hasVitals) {
    themes.push({
      id: 'vitals',
      title: 'Sinais vitais & equilíbrio fisiológico',
      status: 'optimal',
      explanation: 'Os sinais vitais disponíveis não mostram um desvio forte nesta leitura. A interpretação fica mais robusta quando houver comparação com medições anteriores.',
      supportingFacts: ['HR', 'SpO2', 'Temperatura'],
      action: 'Acompanhar evolução',
      confidence: 0.95
    });
    themeDataLinks['vitals'] = ['ecg', 'ppg', 'temp'];
  }

  // T6: Nutrição orientada por sinais
  if (hasData) {
    themes.push({
      id: 'nutrition',
      title: 'Nutrição orientada por sinais',
      status: 'optimal',
      explanation: 'As sugestões nutricionais devem partir dos sinais disponíveis, não de uma dieta genérica. Nesta leitura, hidratação, recuperação e estado intestinal têm mais peso.',
      supportingFacts: ['Digestão', 'Hidratação'],
      action: 'Priorizar alimentos hidratantes',
      confidence: 0.8,
      limitation: 'A leitura não assume efeito direto nem imediato de nutrientes específicos.'
    });
    themeDataLinks['nutrition'] = ['urinalysis', 'fecal'];
  }

  // T7: Stress, foco & autorregulação
  if (hasHRV && hrv < 35) {
    themes.push({
      id: 'stress',
      title: 'Stress, foco & autorregulação',
      status: 'caution',
      explanation: 'Os dados contextuais sugerem que o stress e a recuperação podem estar a influenciar a consistência e a energia. A ação útil deve ser pequena e concreta.',
      supportingFacts: ['HRV'],
      action: 'Reduzir carga cognitiva',
      confidence: 0.7
    });
    themeDataLinks['stress'] = ['ppg'];
  }

  // T8: Sinais a acompanhar
  if (hasData) {
    themes.push({
      id: 'watch',
      title: 'Sinais a acompanhar',
      status: 'optimal',
      explanation: 'Alguns sinais ganham valor apenas quando se repetem. Nesta fase, a leitura deve ser usada como orientação inicial, não como conclusão fechada.',
      supportingFacts: ['Tendência'],
      action: 'Repetir análise',
      confidence: 0.85
    });
    themeDataLinks['watch'] = ['history'];
  }

  // 4. Ações recomendadas (Derivadas dos temas)
  const priorityActions: AIReading['priorityActions'] = themes
    .filter(t => t.action)
    .map(t => ({
      title: t.action!,
      reason: t.explanation.split('.')[0] + '.',
      priority: t.status === 'caution' ? 'high' : 'medium',
      supportingFacts: t.supportingFacts,
      domain: t.id,
      evidenceStrength: t.confidence
    }))
    .slice(0, 3);

  // 5. Dimensões (Mantendo suporte visual)
  const dimensions: AIReading['dimensions'] = [
    { id: 'energy', label: 'Energia & disponibilidade', score: Math.round(hasData ? 85 : 0), explanation: 'Capacidade de resposta a estímulos.', supportingFacts: ['HRV', 'Sono'], confidence: 0.8 },
    { id: 'recovery', label: 'Recuperação & carga', score: Math.round(hasData ? 72 : 0), explanation: 'Eficiência da regeneração celular.', supportingFacts: ['HRV', 'Temperatura'], confidence: 0.75 },
    { id: 'hydration', label: 'Hidratação & equilíbrio urinário', score: Math.round(hasData ? score01(gravidade || 1.015, 1.035, 1.005) : 0), explanation: 'Estado de hidratação celular.', supportingFacts: ['Gravidade'], confidence: 0.9 },
    { id: 'digestion', label: 'Estado intestinal', score: Math.round(hasData ? 80 : 0), explanation: 'Absorção e regularidade.', supportingFacts: ['Bristol'], confidence: 0.85 },
    { id: 'vitals', label: 'Sinais vitais & equilíbrio fisiológico', score: Math.round(hasData ? 90 : 0), explanation: 'Estabilidade cardiovascular.', supportingFacts: ['HR', 'SpO2'], confidence: 0.95 },
  ].filter(d => hasData);

  // 6. Referências
  const families = [];
  if (hasUrine) families.push('Urina');
  if (hasFecal) families.push('Fezes');
  if (hasVitals) families.push('Fisiológicos');
  if (ecosystemFacts.length > 0) families.push('Contextuais');

  return {
    summary: { title: summaryTitle, text: summaryText, confidence: 0.85, mode: isDemo ? 'simulation' : 'real' },
    dimensions,
    priorityActions,
    highlightedThemes: themes.slice(0, 8),
    watchSignals: hasData ? [
      { title: 'Repetir análise para confirmar tendência', explanation: 'Um ponto isolado não define o seu estado biológico.', reasonToRepeat: 'Validar estabilidade cardiovascular' }
    ] : [],
    references: {
      usedDataFamilies: families,
      usedSignals: measurements.map(m => m.marker || m.type),
      freshness: 'recent',
      origins: isDemo ? ['Simulação'] : ['Medição', 'Contexto'],
      confidence: 'high',
      limitations: isDemo ? ['Modo simulação'] : ['Histórico curto'],
      themeDataLinks
    },
    readingLimits: [
      'Esta leitura é interpretativa e deve ser lida em conjunto com os Resultados.',
      'Não substitui avaliação clínica nem faz diagnóstico.',
      'Sinais persistentes, agravamento ou sintomas relevantes devem ser acompanhados por um profissional.'
    ]
  };
}


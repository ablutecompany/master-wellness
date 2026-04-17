/**
 * ANALYSIS ENGINE — Motor de cálculo semântico
 *
 * Converte measurements + ecosystemFacts numa SemanticOutputState completa.
 * É a ÚNICA fonte de verdade para a Leitura AI.
 * Funciona independentemente da origem dos dados (demo, device, manual).
 */

import { SemanticOutputState, SemanticDomainView } from './types';
import { AnalysisMeasurement, AnalysisEvent } from '../../store/types';

// ── Helpers numéricos ─────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function score01(v: number, inMin: number, inMax: number) {
  return clamp(((v - inMin) / (inMax - inMin)) * 100, 0, 100);
}
function band(s: number): 'optimal' | 'fair' | 'poor' {
  return s >= 78 ? 'optimal' : s >= 55 ? 'fair' : 'poor';
}

// ── Extracção de valores dos biomarcadores ────────────────────────────────────

function getMeasurement(ms: AnalysisMeasurement[], type: string, marker?: string): string {
  const val = ms.find(m => m.type === type && (!marker || m.marker === marker))?.value;
  return val !== undefined && val !== null ? String(val) : '';
}

function getSleepHours(facts: AnalysisEvent[]): number {
  const f = facts.find(f => f.type === 'sleep_duration_logged' || f.type === 'sono_profundo');
  if (!f) return 0;
  const raw = String(f.value ?? '');
  const match = raw.match(/(\d+)h\s*(\d+)?/);
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
    mainInsight: { id: `insight_${domain}_${Date.now()}`, summary, description, tone: 'informative', factors: [] },
    recommendations: recs.map((r, i) => ({
      id: `rec_${domain}_${i}_${Date.now()}`, title: r.title, actionable: r.actionable, impact: 'médio', effort: 'baixo'
    })) as any,
  };
}

// ── Motor principal ─────────────────────────────────────────────────────────────

/**
 * Calcula a SemanticOutputState a partir de measurements + ecosystemFacts.
 * Cada domain score é derivado directamente dos valores medidos.
 * Mudar um biomarcador muda o score e o texto — sem narrativa hardcoded.
 */
export function computeSemanticFromMeasurements(
  measurements: AnalysisMeasurement[],
  ecosystemFacts: AnalysisEvent[],
): SemanticOutputState {
  // Nenhum dado → estado honesto
  if (measurements.length === 0 && ecosystemFacts.length === 0) {
    return buildEmptyState();
  }

  // ── Extracção ──────────────────────────────────────────────────────────────
  const hr = parseFloat(getMeasurement(measurements, 'ecg', 'Ritmo Cardíaco') || '0');
  const hrv = parseFloat(getMeasurement(measurements, 'ppg', 'HRV Estimada') || '0');
  const spo2 = parseFloat(getMeasurement(measurements, 'ppg', 'SpO2') || '0');
  const temp = parseFloat(getMeasurement(measurements, 'temp', 'Temperatura') || '0');
  const gravidade = parseFloat(getMeasurement(measurements, 'urinalysis', 'Gravidade Específica') || '0');
  const phUrinary = parseFloat(getMeasurement(measurements, 'urinalysis', 'pH Urinário') || '7');
  const proteinas = getMeasurement(measurements, 'urinalysis', 'Proteínas');
  const glucose = getMeasurement(measurements, 'urinalysis', 'Glicose');
  const cetones = getMeasurement(measurements, 'urinalysis', 'Corpos Cetónicos');
  const urobilinogenio = getMeasurement(measurements, 'urinalysis', 'Urobilinogénio');
  const cortisol = getMeasurement(measurements, 'urinalysis', 'Cortisol Urinário');
  const bristol = getMeasurement(measurements, 'fecal', 'Bristol');
  const sleepH = getSleepHours(ecosystemFacts);

  const hasHRV = hrv > 0;
  const hasSleep = sleepH > 0;
  const isDehydrated = gravidade > 1.027;
  const hasProtein = proteinas.includes('Traços') || proteinas.includes('Positivo');
  const hasGlucose = glucose.includes('Positivo');
  const hasKetones = cetones.includes('Positivo');
  const highUrobi = urobilinogenio.includes('Elevado');
  const highCortisol = cortisol.includes('Elevado');
  const bristolNum = parseInt(bristol.match(/\d+/)?.[0] || '4');
  const goodBristol = bristolNum === 3 || bristolNum === 4 || bristolNum === 5;
  const badBristol = bristolNum <= 2 || bristolNum >= 6;

  // ── SLEEP ──────────────────────────────────────────────────────────────────
  const sleepScore = (() => {
    let s = hasSleep ? score01(sleepH, 4, 9) : 50;
    if (hasHRV) s = s * 0.6 + score01(hrv, 15, 65) * 0.4;
    if (highCortisol) s -= 15;
    return Math.round(clamp(s, 0, 100));
  })();
  const sleepLabel = sleepScore >= 78 ? 'Restaurador' : sleepScore >= 55 ? 'Moderado' : 'Insuficiente';
  const sleepSummary = !hasSleep ? 'Duração de sono não registada'
    : sleepH >= 7.5 ? `Sono profundo — ${formatHours(sleepH)} registadas`
    : sleepH >= 6 ? `Sono moderado — ${formatHours(sleepH)} registadas`
    : `Sono reduzido — apenas ${formatHours(sleepH)} registadas`;
  const sleepDesc = [
    hasHRV && hrv < 35 ? `HRV em ${hrv}ms indica dominância simpática residual durante o repouso.` : null,
    hasHRV && hrv >= 50 ? `HRV em ${hrv}ms confirma recuperação parassimpática eficaz.` : null,
    highCortisol ? 'Cortisol urinário elevado aponta para activação tardia do eixo HPA.' : null,
    hasSleep && sleepH < 6 ? 'Abaixo das 6 horas a consolidação de memória e regeneração celular ficam comprometidas.' : null,
    !hasSleep ? 'Sincronize uma app de sono para obter interpretação aprofundada.' : null,
  ].filter(Boolean).join(' ') || 'Parâmetros dentro dos limites esperados.';

  // ── NUTRITION ──────────────────────────────────────────────────────────────
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
    : hasKetones ? 'Corpos cetónicos positivos — défice calórico activo'
    : highUrobi ? 'Urobilinogénio elevado — sobrecarga hepática metabólica'
    : 'Perfil urinário sem marcadores de stress glicémico ou cetónico';
  const nutritionDesc = [
    hasGlucose ? 'Glicose urinária positiva indica sobrecarga glicémica aguda.' : null,
    hasKetones ? 'Corpos cetónicos positivos — o organismo recorre às reservas de gordura por défice calórico.' : null,
    highUrobi ? 'Urobilinogénio elevado pode indicar sobrecarga hepática.' : null,
    !hasGlucose && !hasKetones && !highUrobi ? 'Glicose e proteínas negativas — sinalização metabólica estável.' : null,
    isDehydrated ? `Gravidade específica de ${gravidade} — ingestão de líquidos abaixo do ideal.` : null,
  ].filter(Boolean).join(' ') || 'Parâmetros metabólicos dentro dos valores de referência.';

  // ── GENERAL ────────────────────────────────────────────────────────────────
  const generalScore = (() => {
    const hrS = hr > 0 ? score01(hr, 100, 55) : 70;
    const spo2S = spo2 > 0 ? score01(spo2, 92, 100) : 80;
    const tempS = temp > 0 ? (temp >= 36.1 && temp <= 37.2 ? 100 : temp <= 37.5 ? 70 : 40) : 75;
    const hydS = isDehydrated ? 50 : gravidade > 0 && gravidade < 1.005 ? 60 : 90;
    let s = hrS * 0.35 + spo2S * 0.35 + tempS * 0.2 + hydS * 0.1;
    if (hasProtein) s -= 8;
    return Math.round(clamp(s, 0, 100));
  })();
  const generalLabel = generalScore >= 78 ? 'Homeostase' : generalScore >= 55 ? 'Estável' : 'Sob Pressão';
  const generalSummary = spo2 >= 98 && hr > 0 && hr <= 70 ? `Sistema cardiovascular em pico — SpO2 ${spo2}%, HR ${hr} bpm`
    : temp > 37.2 ? `Temperatura elevada (${temp}°C) — sinal inflamatório activo`
    : hr > 85 ? `Taquicardia de repouso (${hr} bpm) — sistema sob carga`
    : 'Leituras fisiológicas dentro do intervalo funcional';
  const generalDesc = [
    spo2 > 0 ? `SpO2 em ${spo2}% — ${spo2 >= 98 ? 'oxigenação óptima' : spo2 >= 95 ? 'adequada' : 'ligeiramente reduzida'}.` : null,
    hr > 0 ? `Ritmo cardíaco em repouso de ${hr} bpm — ${hr <= 65 ? 'excelente adaptação aeróbia' : hr <= 75 ? 'dentro do normal' : 'ligeiramente elevado'}.` : null,
    temp > 0 ? `Temperatura basal de ${temp}°C — ${temp <= 37.0 ? 'sem sinais inflamatórios' : 'possível reacção inflamatória activa'}.` : null,
    isDehydrated ? `Gravidade urinária de ${gravidade} acusa desidratação.` : null,
  ].filter(Boolean).join(' ') || 'Parâmetros gerais dentro dos limites esperados.';

  // ── ENERGY ─────────────────────────────────────────────────────────────────
  const energyScore = (() => {
    const hrS = hr > 0 ? score01(hr, 100, 55) : 70;
    const sleepS = hasSleep ? score01(sleepH, 3, 9) : 55;
    const cetonesP = hasKetones ? -20 : 0;
    const cortisolP = highCortisol ? -15 : 0;
    const urobi = highUrobi ? -10 : 0;
    return Math.round(clamp(hrS * 0.45 + sleepS * 0.45 + 10 + cetonesP + cortisolP + urobi, 0, 100));
  })();
  const energyLabel = energyScore >= 78 ? 'Elevada' : energyScore >= 55 ? 'Moderada' : 'Em Baixo';
  const energySummary = hr > 85 ? `Frequência cardíaca elevada (${hr} bpm) — sistema em sobre-activação`
    : hasKetones ? 'Cetose activa — energia proveniente de reservas lipídicas'
    : hasSleep && sleepH < 6 ? `Recarregamento incompleto — ${formatHours(sleepH)} de sono`
    : 'Capacidade energética funcional detectada';
  const energyDesc = [
    hasSleep && sleepH >= 7 ? `${formatHours(sleepH)} de sono garantem reservas energéticas repostas.` : null,
    hasSleep && sleepH < 6 ? `Apenas ${formatHours(sleepH)} de sono — capacidade de trabalho cognitivo e físico reduzida.` : null,
    hasKetones ? 'Corpos cetónicos positivos indicam utilização de gordura como substrato energético principal.' : null,
    highCortisol ? 'Cortisol elevado gera energia artificial de curto prazo com custo metabólico elevado.' : null,
    hr > 80 ? `HR de ${hr} bpm em repouso acusa elevada demanda simpática.` : null,
  ].filter(Boolean).join(' ') || 'Parâmetros energéticos dentro dos valores funcionais.';

  // ── RECOVERY ───────────────────────────────────────────────────────────────
  const recoveryScore = (() => {
    const hrvS = hasHRV ? score01(hrv, 15, 65) : 60;
    const bristolS = goodBristol ? 90 : badBristol ? 45 : 70;
    const tempS = temp > 37.2 ? 50 : 90;
    const proteinP = hasProtein ? -10 : 0;
    return Math.round(clamp(hrvS * 0.55 + bristolS * 0.25 + tempS * 0.2 + proteinP, 0, 100));
  })();
  const recoveryLabel = recoveryScore >= 78 ? 'Completa' : recoveryScore >= 55 ? 'Parcial' : 'Insuficiente';
  const recoverySummary = hasHRV && hrv < 30 ? `HRV crítica (${hrv}ms) — recuperação autonómica comprometida`
    : hasHRV && hrv >= 50 ? `HRV elevada (${hrv}ms) — recuperação autonómica eficaz`
    : badBristol ? `Trânsito intestinal alterado (${bristol}) — absorção comprometida`
    : 'Capacidade de recuperação funcional';
  const recoveryDesc = [
    hasHRV ? `HRV estimada em ${hrv}ms — ${hrv >= 50 ? 'sistema parassimpático dominante' : hrv >= 30 ? 'recuperação em curso' : 'dominância simpática residual, descanso necessário'}.` : 'HRV não registada — sincronize app de sono para avaliação autonómica.',
    bristol ? (bristolNum !== 4 ? `Bristol ${bristolNum} — ${badBristol ? 'trânsito alterado, absorção comprometida' : 'trânsito ligeiramente irregular'}.` : 'Bristol Tipo 4 — trânsito ideal.') : null,
    hasProtein ? 'Proteínas em traços — indicador de reparação muscular activa pós-esforço.' : null,
    temp > 37.2 ? 'Temperatura elevada — resposta inflamatória a limitar recuperação celular.' : null,
  ].filter(Boolean).join(' ') || 'Indicadores de recuperação dentro dos limites funcionais.';

  // ── PERFORMANCE ────────────────────────────────────────────────────────────
  const performanceScore = (() => {
    const base = (sleepScore + energyScore + recoveryScore + generalScore) / 4;
    const hrBonus = hr > 0 ? (hr <= 65 ? 8 : hr <= 75 ? 3 : -5) : 0;
    const spo2Bonus = spo2 > 0 ? (spo2 >= 98 ? 5 : spo2 >= 95 ? 0 : -8) : 0;
    return Math.round(clamp(base + hrBonus + spo2Bonus, 0, 100));
  })();
  const performanceLabel = performanceScore >= 78 ? 'Pico' : performanceScore >= 55 ? 'Funcional' : 'Limitada';
  const performanceSummary = performanceScore >= 78 ? 'Prontidão sistémica elevada — condições óptimas para desempenho'
    : performanceScore >= 55 ? 'Prontidão funcional — desempenho preservado com reservas moderadas'
    : 'Prontidão comprometida — esforço de pico desaconselhado hoje';
  const performanceDesc = [
    `Score composto: Sono ${sleepScore}, Energia ${energyScore}, Recuperação ${recoveryScore}, Geral ${generalScore}.`,
    performanceScore >= 78 ? 'Todos os sistemas biológicos apontam para capacidade máxima.' : null,
    performanceScore < 55 ? 'Risco de fadiga ou lesão se esforço de alta intensidade hoje.' : null,
    spo2 > 0 && spo2 < 96 ? `SpO2 de ${spo2}% pode limitar capacidade aeróbia máxima.` : null,
  ].filter(Boolean).join(' ');

  // ── Cross-domain summary ───────────────────────────────────────────────────
  const crossSummary = [
    `Sono ${sleepLabel.toLowerCase()} (${sleepScore}/100), energia ${energyLabel.toLowerCase()} (${energyScore}/100), recuperação ${recoveryLabel.toLowerCase()} (${recoveryScore}/100).`,
    sleepScore < 60 || energyScore < 60 || recoveryScore < 60
      ? 'Sinais de atenção detectados — priorize repouso e hidratação.'
      : 'Sistema biológico sem alertas críticos activos.',
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

// ── Estado vazio honesto ────────────────────────────────────────────────────

function buildEmptyState(): SemanticOutputState {
  const emptyDomain = (domain: string): SemanticDomainView => ({
    domain, label: domain, score: 0,
    status: 'insufficient_data', statusLabel: 'Sem Dados', band: 'poor',
    generatedAt: Date.now(), lastComputedAt: Date.now(), isStale: false, version: '1.2.0',
    mainInsight: {
      id: `empty_${domain}`,
      summary: 'Sem dados disponíveis',
      description: 'Não existem dados de análise activos. Selecione uma análise no histórico ou realize uma nova análise.',
      tone: 'informative',
      factors: [],
    },
    recommendations: [],
  });

  return {
    version: '1.2.0',
    generatedAt: Date.now(),
    status: 'insufficient_data',
    isLive: false,
    metadata: {
      lastUpdatedAt: Date.now(), lastRequestedAt: Date.now(),
      isDirty: false, dirtyDomains: {} as Record<string, boolean>,
      staleAfterMs: 300000, retryCount: 0, version: '1.2.0',
    },
    crossDomainSummary: {
      summary: 'Nenhuma análise activa. Selecione ou crie uma análise para ver a leitura AI.',
      coherenceFlags: [], prioritySignals: [], deduplicatedRecommendations: [] as any,
    },
    domains: {
      sleep: emptyDomain('sleep'),
      nutrition: emptyDomain('nutrition'),
      general: emptyDomain('general'),
      energy: emptyDomain('energy'),
      recovery: emptyDomain('recovery'),
      performance: emptyDomain('performance'),
    },
  };
}

function formatHours(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

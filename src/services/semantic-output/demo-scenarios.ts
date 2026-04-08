import { SemanticOutputState, SemanticDomainView } from './types';

export type DemoScenarioKey =
  | 'balanced'
  | 'low_energy'
  | 'poor_recovery'
  | 'irregular_digestion'
  | 'unstable_rhythm'
  | 'mixed';

// ── Tipos para a camada de Resultados ────────────────────────────────────────
export interface DemoMeasurement {
  type: 'urinalysis' | 'ecg' | 'ppg' | 'temp' | 'weight' | 'fecal';
  timestamp: string;
  value: { marker?: string; value: string; unit: string; displayValue?: string };
}

export interface DemoEcosystemFact {
  type: string;         // nome do sinal — ex: 'sleep_duration_logged'
  value: string;        // valor legível — ex: '7h 12m'
  sourceAppId: string;  // app de origem — ex: 'deep_sleep'
  // campos para compatibilidade com ContextFact (filterActiveFacts espera estes)
  id: string;
  domain: string;
  derivedFromEventIds: string[];
  createdAt: number;
  validFrom: number;
  validUntil: number;
  status: 'active';
}

// ── Estrutura unificada – ÚNICA FONTE DE VERDADE ──────────────────────────────
export interface DemoAnalysis {
  scenarioKey: DemoScenarioKey;
  measurements: DemoMeasurement[];    // → Urina + Fisiológica + Fecal em Resultados
  ecosystemFacts: DemoEcosystemFact[]; // → Ecossistema em Resultados
  semanticBundle: SemanticOutputState; // → Leitura AI
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TS = '2026-04-02T08:00:00Z';
const FAR_FUTURE = 9999999999999;

function urine(marker: string, value: string, unit: string): DemoMeasurement {
  return { type: 'urinalysis', timestamp: TS, value: { marker, value, unit } };
}
function physio(type: 'ecg' | 'ppg' | 'temp' | 'weight', label: string, value: string, unit: string): DemoMeasurement {
  return { type, timestamp: TS, value: { marker: label, value, unit } };
}
function fecal(marker: string, value: string, unit: string = ''): DemoMeasurement {
  return { type: 'fecal', timestamp: TS, value: { marker, value, unit } };
}
function eco(type: string, value: string, sourceAppId: string, idx: number): DemoEcosystemFact {
  return {
    id: `demo_eco_${idx}`,
    type,
    value,
    sourceAppId,
    domain: 'general',
    derivedFromEventIds: [`demo_evt_${idx}`],
    createdAt: Date.now(),
    validFrom: Date.now() - 1000,
    validUntil: FAR_FUTURE,
    status: 'active',
  };
}

const baseBundle = {
  version: '1.2.0',
  generatedAt: Date.now(),
  status: 'ready' as const,
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
};

function buildDomain(
  domain: string, score: number, statusLabel: string,
  band: 'optimal' | 'fair' | 'poor', summary: string, description: string,
  recommendations: Array<{ title: string; actionable: string }>
): SemanticDomainView {
  return {
    domain, label: domain, score,
    status: 'sufficient_data', statusLabel, band,
    generatedAt: Date.now(), lastComputedAt: Date.now(), isStale: false, version: '1.2.0',
    mainInsight: { id: `insight_${domain}`, summary, description, tone: 'informative', factors: [] },
    recommendations: recommendations.map((r, i) => ({
      id: `rec_${domain}_${i}`, title: r.title, actionable: r.actionable, impact: 'médio', effort: 'baixo'
    })) as any
  };
}

// ── 6 CENÁRIOS COMPLETOS ──────────────────────────────────────────────────────

const SCENARIOS_MAP: Record<DemoScenarioKey, DemoAnalysis> = {

  // ────────────────────────────────────────────────────────────────────────────
  balanced: {
    scenarioKey: 'balanced',
    measurements: [
      // Urina (4 markers)
      urine('Gravidade Específica', '1.020', 'sg'),
      urine('pH Urinário', '6.8', 'pH'),
      urine('Proteínas', 'Negativo', ''),
      urine('Glicose', 'Negativo', ''),
      // Fisiológica (4 markers)
      physio('ecg', 'Ritmo Cardíaco', '68', 'bpm'),
      physio('temp', 'Temperatura', '36.6', '°C'),
      physio('weight', 'Peso', '72.0', 'kg'),
      physio('ppg', 'SpO2', '98', '%'),
      // Fecal (3 markers)
      fecal('Consistência', 'Tipo 4 — Ideal'),
      fecal('Frequência', '1× por dia'),
      fecal('pH Fecal', '6.5', 'pH'),
    ],
    ecosystemFacts: [
      eco('sleep_duration_logged', '7h 12m registadas', 'deep_sleep', 0),
      eco('hydration_goal_met', '2.1 L consumidos', '_hydra', 1),
      eco('meal_plan_followed', 'Refeições equilibradas', 'nutri-menu', 2),
    ],
    semanticBundle: {
      ...baseBundle,
      crossDomainSummary: {
        summary: 'Ecossistema biográfico em perfeito alinhamento. Todos os vetores indicam estabilidade metabólica.',
        coherenceFlags: ['homeostasis_achieved'],
        prioritySignals: [],
        deduplicatedRecommendations: [{ id: 'cd_1', title: 'Foco Geral', actionable: 'Mantenha o padrão de hidratação atual.', impact: 'alto', effort: 'baixo' }] as any
      },
      domains: {
        sleep: buildDomain('sleep', 92, 'Restaurador', 'optimal', 'Ciclos consolidados', 'O descanso foi profundo (7h12m), cobrindo as necessidades basais do cérebro.', [{ title: 'Manter Janela', actionable: 'Mantenha a hora de deitar atual.' }]),
        nutrition: buildDomain('nutrition', 88, 'Equilibrado', 'optimal', 'Aporte estável', 'Sem sinais de stress glicémico. Glicose e proteínas urinárias negativas confirmam equilíbrio.', []),
        general: buildDomain('general', 90, 'Ótimo', 'optimal', 'Homeostase', 'SpO2 em 98%, temperatura estável e gravidade urinária normal indicam saúde sistémica.', []),
        energy: buildDomain('energy', 89, 'Elevada', 'optimal', 'Resiliência Alta', 'Hr em repouso de 68 bpm e hidratação a 2.1L sustentam capacidade energética plena.', []),
        recovery: buildDomain('recovery', 95, 'Completa', 'optimal', 'Vagotomia ideal', 'A resposta parassimpática atuou a 100% durante a noite. pH fecal equilibrado.', []),
        performance: buildDomain('performance', 91, 'Pico', 'optimal', 'Prontidão Sistémica', 'Todos os biomarcadores apontam para capacidade máxima de desempenho.', [])
      }
    } as SemanticOutputState,
  },

  // ────────────────────────────────────────────────────────────────────────────
  low_energy: {
    scenarioKey: 'low_energy',
    measurements: [
      // Urina — padrão de desidratação e stress metabólico
      urine('Gravidade Específica', '1.030', 'sg'),
      urine('pH Urinário', '5.5', 'pH'),
      urine('Corpos Cetónicos', 'Positivo (+)', ''),
      urine('Urobilinogénio', 'Elevado', 'mg/dL'),
      // Fisiológica — taquicardia de repouso, peso baixo
      physio('ecg', 'Ritmo Cardíaco', '84', 'bpm'),
      physio('temp', 'Temperatura', '36.2', '°C'),
      physio('weight', 'Peso', '71.2', 'kg'),
      physio('ppg', 'SpO2', '96', '%'),
      // Fecal — trânsito acelerado
      fecal('Consistência', 'Tipo 6 — Mole'),
      fecal('Frequência', '2× por dia'),
      fecal('pH Fecal', '7.2', 'pH'),
    ],
    ecosystemFacts: [
      eco('sleep_duration_logged', '5h 20m registadas', 'deep_sleep', 0),
      eco('caloric_deficit_logged', 'Défice calórico registado', 'nutri-menu', 1),
      eco('fatigue_context_added', 'Elevada fadiga matinal', 'deep_sleep', 2),
    ],
    semanticBundle: {
      ...baseBundle,
      crossDomainSummary: {
        summary: 'Detetada quebra substancial na disponibilidade energética global devido a défice partilhado nos sinais.',
        coherenceFlags: ['energy_depletion'],
        prioritySignals: [],
        deduplicatedRecommendations: [{ id: 'cd_2', title: 'Ritmo Diário', actionable: 'Pondere abrandar o ritmo cognitivo na segunda metade do dia.', impact: 'alto', effort: 'baixo' }] as any
      },
      domains: {
        sleep: buildDomain('sleep', 65, 'Fragmentado', 'fair', 'Despertares noturnos', 'Apenas 5h20m de sono — micro-interrupções impediram consolidação do repouso celular profundo.', [{ title: 'Reduzir Estimulantes', actionable: 'Evite cafeína 6h antes de deitar.' }]),
        nutrition: buildDomain('nutrition', 60, 'Défice Calórico', 'fair', 'Reservas baixas', 'Corpos cetónicos positivos e urobilinogénio elevado apontam para défice nutricional ativo.', []),
        general: buildDomain('general', 62, 'Fadiga Leve', 'fair', 'Inércia matinal', 'SpO2 em 96% e gravidade urinária elevada (1.030) indicam desidratação e fadiga sistémica.', []),
        energy: buildDomain('energy', 45, 'Em Baixo', 'poor', 'Depleção Aguda', 'HR de 84 bpm em repouso e temperatura basal baixa (36.2°C) refletem esgotamento.', [{ title: 'Pausa Estratégica', actionable: 'Agende 20 min sem ecrãs ao meio-dia.' }]),
        recovery: buildDomain('recovery', 55, 'Lenta', 'poor', 'Ritmo cardíaco elevado em repouso', 'O organismo ainda digere stresses residuais. pH urinário ácido (5.5) confirma sobrecarga.', []),
        performance: buildDomain('performance', 50, 'Limitada', 'fair', 'Capacidade Anaeróbica Fraca', 'Evite treinos de alta intolerância ao lactato nas próximas horas.', [])
      }
    } as SemanticOutputState,
  },

  // ────────────────────────────────────────────────────────────────────────────
  poor_recovery: {
    scenarioKey: 'poor_recovery',
    measurements: [
      // Urina — traços de proteína (microlesões musculares)
      urine('Gravidade Específica', '1.025', 'sg'),
      urine('pH Urinário', '5.8', 'pH'),
      urine('Proteínas', 'Traços (+/-)', ''),
      urine('Leucócitos', 'Negativo', ''),
      // Fisiológica — HRV suprimida (via PPG como proxy)
      physio('ecg', 'Ritmo Cardíaco', '76', 'bpm'),
      physio('ppg', 'HRV Estimada', '28', 'ms'),
      physio('temp', 'Temperatura', '36.9', '°C'),
      physio('weight', 'Peso', '75.3', 'kg'),
      // Fecal — trânsito lento
      fecal('Consistência', 'Tipo 3 — Duro'),
      fecal('Frequência', '1× em 2 dias'),
      fecal('pH Fecal', '6.0', 'pH'),
    ],
    ecosystemFacts: [
      eco('hrv_suppressed', 'HRV suprimida — 28ms', 'deep_sleep', 0),
      eco('intense_training_logged', 'Treino intenso registado', '_motion', 1),
      eco('recovery_debt_detected', 'Dívida de recuperação ativa', 'deep_sleep', 2),
    ],
    semanticBundle: {
      ...baseBundle,
      crossDomainSummary: {
        summary: 'O limiar de recuperação cruzou a barreira de fadiga acumulada. Treino ou stress agudo a dominar.',
        coherenceFlags: ['sympathetic_dominance'],
        prioritySignals: [],
        deduplicatedRecommendations: [{ id: 'cd_3', title: 'Calma Interna', actionable: 'Priorize movimentos curtos e respiração diafragmática.', impact: 'alto', effort: 'baixo' }] as any
      },
      domains: {
        sleep: buildDomain('sleep', 70, 'Regular', 'fair', 'Profundidade fraca', 'Horas suficientes mas HRV suprimida (28ms) indica que o repouso celular não completou ciclos REM.', []),
        nutrition: buildDomain('nutrition', 75, 'Aceitável', 'fair', 'Esforço metabólico', 'Proteínas urinárias em traços confirmam reparação tecidular ativa pós-treino intenso.', []),
        general: buildDomain('general', 60, 'Sobrecarga', 'poor', 'Inflamação sistémica', 'Temperatura em 36.9°C e proteínas urinários indicam fase aguda de inflamação de treino.', []),
        energy: buildDomain('energy', 65, 'Funcional', 'fair', 'Energia superficial', 'O SNC compensa com adrenalina em vez de energia basal. Trânsito intestinal lento confirma.', []),
        recovery: buildDomain('recovery', 35, 'Insuficiente', 'poor', 'Dominância Simpática', 'HRV em 28ms — muito abaixo do ideal. O corpo permanece em modo alerta mesmo após a noite.', [{ title: 'Sono Reparador', actionable: 'Aumente a duração da cama em pelo menos 1 hora.' }]),
        performance: buildDomain('performance', 45, 'Baixa', 'poor', 'Prontidão Comprometida', 'Risco elevado de lesão ou fadiga extrema se houver esforço de pico hoje.', [])
      }
    } as SemanticOutputState,
  },

  // ────────────────────────────────────────────────────────────────────────────
  irregular_digestion: {
    scenarioKey: 'irregular_digestion',
    measurements: [
      // Urina — processos metabólicos digestivos prolongados
      urine('Gravidade Específica', '1.018', 'sg'),
      urine('pH Urinário', '7.2', 'pH'),
      urine('Urobilinogénio', 'Elevado', 'mg/dL'),
      urine('Bilirrubina', 'Traços (+/-)', ''),
      // Fisiológica — reação gástrica com pico térmico
      physio('ecg', 'Ritmo Cardíaco', '71', 'bpm'),
      physio('temp', 'Temperatura', '37.1', '°C'),
      physio('weight', 'Peso', '73.8', 'kg'),
      physio('ppg', 'SpO2', '97', '%'),
      // Fecal — irregularidade marcada
      fecal('Consistência', 'Tipo 5 — Mole'),
      fecal('Frequência', '3× por dia'),
      fecal('pH Fecal', '7.8', 'pH'),
      fecal('Muco Presente', 'Sim — Ligeiro'),
    ],
    ecosystemFacts: [
      eco('late_meal_logged', 'Refeição pesada às 23h00', 'nutri-menu', 0),
      eco('fasting_cycle_broken', 'Ciclo de jejum interrompido', '_fasting', 1),
      eco('digestive_discomfort_logged', 'Desconforto digestivo registado', 'nutri-menu', 2),
    ],
    semanticBundle: {
      ...baseBundle,
      crossDomainSummary: {
        summary: 'Assimetrias no sistema metabólico estão a drenar processos de recuperação noturna.',
        coherenceFlags: ['metabolic_load'],
        prioritySignals: [],
        deduplicatedRecommendations: [{ id: 'cd_4', title: 'Equilíbrio Tardio', actionable: 'Alivie a carga glicémica do jantar hoje.', impact: 'alto', effort: 'baixo' }] as any
      },
      domains: {
        sleep: buildDomain('sleep', 55, 'Agitado', 'poor', 'Picos de temperatura basal', 'Temperatura em 37.1°C e bilirrubina em traços indicam processos digestivos ativos durante o sono.', []),
        nutrition: buildDomain('nutrition', 40, 'Sobrecarga Tardia', 'poor', 'Digestão noturna ativa', 'Urobilinogénio elevado e muco fecal confirmam sobrecarga digestiva nocturna. Refeição pesada às 23h.', [{ title: 'Jantar Precoce', actionable: 'Faça a última refeição pesada 3h antes do repouso.' }]),
        general: buildDomain('general', 65, 'Tenso', 'fair', 'Reação gástrica', 'pH urinário alcalino (7.2) em combinação com pH fecal elevado (7.8) indica desequilíbrio intestinal.', []),
        energy: buildDomain('energy', 70, 'Alternante', 'fair', 'Quebras Glicémicas', 'Picos agudos de energia seguidos de letargia — padrão de carga glicémica tardia confirmado.', []),
        recovery: buildDomain('recovery', 60, 'Parcial', 'fair', 'Bloqueio parassimpático temporário', 'O sistema autónomo só estabilizou na segunda metade da madrugada, após digestão concluída.', []),
        performance: buildDomain('performance', 75, 'Aceitável', 'fair', 'Potência preservada', 'Apesar da irregularidade digestiva, a resistência pode vacilar em esforços prolongados.', [])
      }
    } as SemanticOutputState,
  },

  // ────────────────────────────────────────────────────────────────────────────
  unstable_rhythm: {
    scenarioKey: 'unstable_rhythm',
    measurements: [
      // Urina — cortisol urinário elevado (jetlag social)
      urine('Gravidade Específica', '1.022', 'sg'),
      urine('pH Urinário', '6.2', 'pH'),
      urine('Cortisol Urinário', 'Elevado', 'µg/dL'),
      urine('Melatonina (indireta)', 'Baixa', 'ng/mL'),
      // Fisiológica — HRV moderado, temperatura variável
      physio('ecg', 'Ritmo Cardíaco', '79', 'bpm'),
      physio('ppg', 'HRV Estimada', '35', 'ms'),
      physio('temp', 'Temperatura', '36.4', '°C'),
      physio('weight', 'Peso', '72.5', 'kg'),
      // Fecal — trânsito normal mas com variação
      fecal('Consistência', 'Tipo 4 — Normal'),
      fecal('Frequência', '1× por dia'),
      fecal('pH Fecal', '6.8', 'pH'),
    ],
    ecosystemFacts: [
      eco('late_bedtime_logged', 'Hora de deitar: 02h30', 'deep_sleep', 0),
      eco('irregular_fasting_logged', 'Jejum com horários irregulares', '_fasting', 1),
      eco('circadian_drift_detected', 'Desvio circadiano detectado', 'deep_sleep', 2),
    ],
    semanticBundle: {
      ...baseBundle,
      crossDomainSummary: {
        summary: 'Inconsistência circadiana identificada. O corpo apresenta desincronização em relação ao seu padrão de referência.',
        coherenceFlags: ['circadian_drift'],
        prioritySignals: [],
        deduplicatedRecommendations: [{ id: 'cd_5', title: 'Sincronizar Relógio', actionable: 'Exponha-se a luz natural no pico da manhã para re-ancorar o relógio.', impact: 'alto', effort: 'baixo' }] as any
      },
      domains: {
        sleep: buildDomain('sleep', 60, 'Desalojado', 'poor', 'Jetlag Social', 'Cortisol urinário elevado e melatonina baixa confirmam desfasamento circadiano de +90 minutos.', [{ title: 'Recuo Progressivo', actionable: 'Deite-se 15m mais cedo a cada dia.' }]),
        nutrition: buildDomain('nutrition', 72, 'Descompassado', 'fair', 'Refeições fora do eixo', 'Jejum irregular e cortisol elevado causam sinalização de fome em horários estranhos ao metabolismo.', []),
        general: buildDomain('general', 68, 'Confuso', 'fair', 'Assincronia Térmica', 'Temperatura em 36.4°C (variável) sem seguir curva natural de arrefecimento diário.', []),
        energy: buildDomain('energy', 80, 'Forçada', 'fair', 'Combustível Adrenérgico', 'HR em 79 bpm mascarando cansaço. Cortisol tardio a fornecer energia artificial.', []),
        recovery: buildDomain('recovery', 70, 'Modulada', 'fair', 'Adaptação forçada', 'HRV em 35ms — limiar funcional. A recuperação celular processa-se fora do horário preferencial.', []),
        performance: buildDomain('performance', 65, 'Mediocre', 'fair', 'Latência Neurológica', 'Haverá latência neurológica visível ao focar em tarefas complexas ou reações rápidas hoje.', [])
      }
    } as SemanticOutputState,
  },

  // ────────────────────────────────────────────────────────────────────────────
  mixed: {
    scenarioKey: 'mixed',
    measurements: [
      // Urina — perfil de atleta com excesso de creatina
      urine('Gravidade Específica', '1.021', 'sg'),
      urine('pH Urinário', '6.5', 'pH'),
      urine('Creatinina', 'Elevada', 'mg/dL'),
      urine('Vitamina C', 'Adequada', ''),
      // Fisiológica — HR em repouso excelente
      physio('ecg', 'Ritmo Cardíaco', '66', 'bpm'),
      physio('temp', 'Temperatura', '36.7', '°C'),
      physio('weight', 'Peso', '74.1', 'kg'),
      physio('ppg', 'SpO2', '97', '%'),
      // Fecal — trânsito normal, fibra visível (dieta rica)
      fecal('Consistência', 'Tipo 4 — Ideal'),
      fecal('Frequência', '1× por dia'),
      fecal('pH Fecal', '6.6', 'pH'),
      fecal('Fibra Visível', 'Sim — Adequada'),
    ],
    ecosystemFacts: [
      eco('cardio_session_logged', 'Cardio efetuado — 35 min', '_cardio', 0),
      eco('high_protein_intake', 'Proteína alta registada', 'nutri-menu', 1),
      eco('mixed_sleep_cycle', 'Ciclo de sono misto — 6h48m', 'deep_sleep', 2),
    ],
    semanticBundle: {
      ...baseBundle,
      crossDomainSummary: {
        summary: 'Perfil comportamental misto com grande assimetria temporal. Alta potência matinal com fadiga crassa vespertina.',
        coherenceFlags: ['asymmetrical_response'],
        prioritySignals: [],
        deduplicatedRecommendations: [{ id: 'cd_6', title: 'Atenção às Transições', actionable: 'Cuidado extra nas transições de ambiente. Hidrate após o cardio.', impact: 'alto', effort: 'baixo' }] as any
      },
      domains: {
        sleep: buildDomain('sleep', 80, 'Bom', 'optimal', 'Eficiência moderada', 'Ciclo de 6h48m com boa proporção REM. Creatinina elevada confirma atividade física intensa recente.', []),
        nutrition: buildDomain('nutrition', 85, 'Densa', 'optimal', 'Saciedade protetora', 'Vitamina C adequada e dieta rica em fibra confirmam aporte nutricional de qualidade.', []),
        general: buildDomain('general', 79, 'Controlado', 'optimal', 'Leituras variadas', 'HR em 66 bpm e SpO2 em 97% — excelente saúde cardiovascular de base. Creatinina elevada normal pós-treino.', []),
        energy: buildDomain('energy', 55, 'Errática', 'poor', 'Depleção local vespertina', 'Quebras notórias na resposta energética do final do dia após cardio intenso.', [{ title: 'Mudar Estímulo', actionable: 'Troque a ginástica tardia por leitura antes das 22h.' }]),
        recovery: buildDomain('recovery', 88, 'Afinada', 'optimal', 'Eficiência metabólica na pausa', 'pH fecal equilibrado e fibra adequada suportam recuperação intestinal e muscular eficaz.', []),
        performance: buildDomain('performance', 76, 'Aceitável', 'fair', 'Capacidade condicional', 'A força cardiovascular está preservada (66 bpm repouso). Capacidade executiva cerebral reduzida vespertina.', [])
      }
    } as SemanticOutputState,
  },
};

// ── API pública ───────────────────────────────────────────────────────────────

/** Retorna a demoAnalysis completa para um cenário — fonte única de verdade */
export const DEMO_SCENARIOS: Record<DemoScenarioKey, SemanticOutputState> =
  Object.fromEntries(
    Object.entries(SCENARIOS_MAP).map(([k, v]) => [k, v.semanticBundle])
  ) as Record<DemoScenarioKey, SemanticOutputState>;

/** Retorna o objeto unificado completo (Resultados + Leitura AI) */
export function getDemoAnalysis(key: DemoScenarioKey): DemoAnalysis {
  return SCENARIOS_MAP[key];
}

/** Retorna apenas os measurements (para filteredMeasurements no HomeScreen) */
export function getDemoMeasurements(key: DemoScenarioKey): DemoMeasurement[] {
  return SCENARIOS_MAP[key].measurements;
}

/** Retorna apenas os factos de ecossistema (para activeFacts no HomeScreen) */
export function getDemoEcosystemFacts(key: DemoScenarioKey): DemoEcosystemFact[] {
  return SCENARIOS_MAP[key].ecosystemFacts;
}

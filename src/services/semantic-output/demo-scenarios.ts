import { SemanticOutputState, SemanticDomainView } from './types';

export type DemoScenarioKey = 
  | 'balanced' 
  | 'low_energy' 
  | 'poor_recovery' 
  | 'irregular_digestion' 
  | 'unstable_rhythm' 
  | 'mixed';

const BASE_TIMESTAMP = 1714172400000; // April 26, 2024 23:00:00

const baseBundle: Partial<SemanticOutputState> = {
  version: '1.2.0',
  generatedAt: BASE_TIMESTAMP,
  status: 'ready',
  isLive: true,
};

function buildDomain(
  domain: string, 
  score: number, 
  statusLabel: string, 
  band: 'optimal' | 'fair' | 'poor',
  summary: string, 
  description: string, 
  recommendations: Array<{title: string, actionable: string}>
): SemanticDomainView {
  return {
    domain,
    label: domain,
    score,
    status: 'sufficient_data',
    statusLabel,
    band,
    generatedAt: BASE_TIMESTAMP,
    lastComputedAt: BASE_TIMESTAMP,
    isStale: false,
    version: '1.2.0',
    mainInsight: {
      id: `insight_${domain}`,
      summary,
      description,
      tone: 'informative',
      factors: []
    },
    recommendations: recommendations.map((r, i) => ({
      id: `rec_${domain}_${i}`,
      title: r.title || 'Ação Recomendada',
      actionable: r.actionable,
      impact: 'médio',
      effort: 'baixo'
    })) as any
  };
}

export const DEMO_SCENARIOS: Record<DemoScenarioKey, SemanticOutputState> = {
  balanced: {
    ...baseBundle,
    status: 'ready',
    crossDomainSummary: {
      summary: 'Ecossistema biográfico em perfeito alinhamento. Todos os vetores indicam estabilidade metabólica.',
      coherenceFlags: ['homeostasis_achieved'],
      prioritySignals: [],
      deduplicatedRecommendations: [{ id: 'cd_1', title: 'Foco Geral', actionable: 'Mantenha o padrão de hidratação atual.', impact: 'alto', effort: 'baixo' }] as any
    },
    domains: {
      sleep: buildDomain('sleep', 92, 'Restaurador', 'optimal', 'Ciclos consolidados', 'O descanso foi profundo e contínuo, cobrindo as necessidades basais do cérebro.', [{ title: 'Manter Janela', actionable: 'Mantenha a hora de deitar atual para ancorar o ritmo.' }]),
      nutrition: buildDomain('nutrition', 88, 'Equilibrado', 'optimal', 'Aporte estável', 'Não há sinais de stress glicémico. A carga alimentar está perfeitamente faseada.', []),
      general: buildDomain('general', 90, 'Ótimo', 'optimal', 'Homeostase', 'Biomarcadores gerais em linha com o seu padrão de excelência.', []),
      energy: buildDomain('energy', 89, 'Elevada', 'optimal', 'Resiliência Alta', 'Dispõe de capacidade de resposta máxima a estímulos físicos.', []),
      recovery: buildDomain('recovery', 95, 'Completa', 'optimal', 'Vagotomia ideal', 'A resposta parassimpática atuou a 100% durante a noite.', []),
      performance: buildDomain('performance', 91, 'Pico', 'optimal', 'Prontidão Sistémica', 'Preparado para cargas anaeróbicas exigentes hoje.', [])
    }
  } as SemanticOutputState,

  low_energy: {
    ...baseBundle,
    status: 'ready',
    crossDomainSummary: {
      summary: 'Detetada quebra substancial na disponibilidade energética global devido a um défice partilhado nos sinais.',
      coherenceFlags: ['energy_depletion'],
      prioritySignals: [],
      deduplicatedRecommendations: [{ id: 'cd_2', title: 'Ritmo Diário', actionable: 'Pondere abrandar o ritmo cognitivo na segunda metade do dia.', impact: 'alto', effort: 'baixo' }] as any
    },
    domains: {
      sleep: buildDomain('sleep', 65, 'Fragmentado', 'fair', 'Despertares noturnos', 'Houve micro-interrupções do sono que impediram a consolidação do repouso celular profundos.', [{ title: 'Reduzir Estimulantes', actionable: 'Evite cafeína 6h antes de deitar.' }]),
      nutrition: buildDomain('nutrition', 60, 'Défice Calórico', 'fair', 'Reservas baixas', 'A refeição da noite anterior não preencheu o desgaste diário.', []),
      general: buildDomain('general', 62, 'Fadiga Leve', 'fair', 'Inércia matinal', 'O corpo iniciou o dia com uma ligeira resistência autonómica.', []),
      energy: buildDomain('energy', 45, 'Em Baixo', 'poor', 'Depleção Aguda', 'O tanque energético reflete a fadiga combinada da semana.', [{ title: 'Pausa Estratégica', actionable: 'Agende uma janela de 20 min sem ecrãs ao meio-dia.' }]),
      recovery: buildDomain('recovery', 55, 'Lenta', 'poor', 'Ritmo cardíaco de repouso elevado', 'O seu organismo ainda tenta digerir os stresses residuais de ontem.', []),
      performance: buildDomain('performance', 50, 'Limitada', 'fair', 'Capacidade Anaeróbica Fraca', 'Evite treinos de alta intolerância ao lactato nas próximas horas.', [])
    }
  } as SemanticOutputState,

  poor_recovery: {
    ...baseBundle,
    status: 'ready',
    crossDomainSummary: {
      summary: 'O limiar de recuperação cruzou a barreira de fadiga acumulada. Treino ou stress agudo a dominar.',
      coherenceFlags: ['sympathetic_dominance'],
      prioritySignals: [],
      deduplicatedRecommendations: [{ id: 'cd_3', title: 'Calma Interna', actionable: 'Priorize movimentos curtos e respiração diafragmática.', impact: 'alto', effort: 'baixo' }] as any
    },
    domains: {
      sleep: buildDomain('sleep', 70, 'Regular', 'fair', 'Duração aceitável, profundidade fraca', 'Apesar de ter dormido horas suficientes, a taxa de variabilidade cardíaca (HRV) manteve-se suprimida.', []),
      nutrition: buildDomain('nutrition', 75, 'Aceitável', 'fair', 'Esforço metabólico', 'Os macronutrientes estão equilibrados, mas a reparação tecidular exige mais proteína.', []),
      general: buildDomain('general', 60, 'Sobrecarga', 'poor', 'Inflamação sistémica', 'A inflamação natural de treino ainda está em fase aguda.', []),
      energy: buildDomain('energy', 65, 'Funcional', 'fair', 'Energia superficial', 'O sistema nervoso central está a compensar com adrenalina em vez de energia basal.', []),
      recovery: buildDomain('recovery', 35, 'Insuficiente', 'poor', 'Dominância Simpática', 'O seu corpo permanece em modo de alerta luta-fuga mesmo após a noite.', [{ title: 'Sono Reparador', actionable: 'Hoje, aumente a duração da cama em pelo menos 1 hora.' }]),
      performance: buildDomain('performance', 45, 'Baixa', 'poor', 'Prontidão Comprometida', 'Risco elevado de lesão ou fadiga extrema se houver esforço de pico.', [])
    }
  } as SemanticOutputState,

  irregular_digestion: {
    ...baseBundle,
    status: 'ready',
    crossDomainSummary: {
      summary: 'Assimetrias no sistema metabólico estão a drenar processos de recuperação noturna.',
      coherenceFlags: ['metabolic_load'],
      prioritySignals: [],
      deduplicatedRecommendations: [{ id: 'cd_4', title: 'Equilíbrio Tardio', actionable: 'Alivie a carga glicémica do jantar hoje.', impact: 'alto', effort: 'baixo' }] as any
    },
    domains: {
      sleep: buildDomain('sleep', 55, 'Agitado', 'poor', 'Picos de temperatura basal', 'Houve elevação térmica e motora coincidente com a janela pós-digestiva.', []),
      nutrition: buildDomain('nutrition', 40, 'Sobrecarga Tardia', 'poor', 'Digestão noturna ativa', 'Detectado processamento metabólico prolongado durante o primeiro ciclo de sono.', [{ title: 'Jantar Precoce', actionable: 'Faça a última refeição pesada idealmente 3h antes do repouso.' }]),
      general: buildDomain('general', 65, 'Tenso', 'fair', 'Reação gástrica', 'Desvio dos sinais de homeostase central no abdómen inferior.', []),
      energy: buildDomain('energy', 70, 'Alternante', 'fair', 'Quebras Glicémicas', 'Picos agudos de energia seguidos de letargia.', []),
      recovery: buildDomain('recovery', 60, 'Parcial', 'fair', 'Bloqueio parassimpático temporário', 'O sistema autónomo só estabilizou na segunda metade da madrugada.', []),
      performance: buildDomain('performance', 75, 'Aceitável', 'fair', 'Potência preservada', 'A resistência pode vacilar em esforços de longa duração.', [])
    }
  } as SemanticOutputState,

  unstable_rhythm: {
    ...baseBundle,
    status: 'ready',
    crossDomainSummary: {
      summary: 'Inconsistência circadiana identificada. O corpo apresenta desincronização em relação ao último padrão de referência.',
      coherenceFlags: ['circadian_drift'],
      prioritySignals: [],
      deduplicatedRecommendations: [{ id: 'cd_5', title: 'Sincronizar Relógio', actionable: 'Exponha-se a luz natural no pico da manhã para re-ancorar o relógio.', impact: 'alto', effort: 'baixo' }] as any
    },
    domains: {
      sleep: buildDomain('sleep', 60, 'Desalojado', 'poor', 'Jetlag Social', 'A hora de adormecer desfasou mais de 90 minutos do seu eixo habitual.', [{ title: 'Recuo Progressivo', actionable: 'Deite-se 15m mais cedo a cada dia até repor o ponto zero.' }]),
      nutrition: buildDomain('nutrition', 72, 'Descompassado', 'fair', 'Refeições fora do eixo', 'A sinalização de fome ocorreu em horários estranhos ao metabolismo basal.', []),
      general: buildDomain('general', 68, 'Confuso', 'fair', 'Assincronia Térmica', 'A temperatura corporal não seguiu a curva natural de arrefecimento diário.', []),
      energy: buildDomain('energy', 80, 'Forçada', 'fair', 'Combustível Adrenérgico', 'Cortisol tardio está a mascarar a sensação de cansaço real.', []),
      recovery: buildDomain('recovery', 70, 'Modulada', 'fair', 'Adaptação forçada', 'A recuperação celular está a processar-se em horários não preferenciais.', []),
      performance: buildDomain('performance', 65, 'Mediocre', 'fair', 'Reação de Reflexos Lenta', 'Haverá latência neurológica visível ao focar-se em tarefas complexas.', [])
    }
  } as SemanticOutputState,

  mixed: {
    ...baseBundle,
    status: 'ready',
    crossDomainSummary: {
      summary: 'Perfil comportamental misto com grande assimetria temporal. Alta potência matinal com fadiga crassa vespertina.',
      coherenceFlags: ['asymmetrical_response'],
      prioritySignals: [],
      deduplicatedRecommendations: [{ id: 'cd_6', title: 'Atenção às Transições', actionable: 'Cuidado extra com as transições de ambiente (quente para o frio).', impact: 'alto', effort: 'baixo' }] as any
    },
    domains: {
      sleep: buildDomain('sleep', 80, 'Bom', 'optimal', 'Eficiência moderada', 'O ciclo RAM esteve presente mas reduzido na proporção global de decanso.', []),
      nutrition: buildDomain('nutrition', 85, 'Densa', 'optimal', 'Saciedade protetora', 'Ingestão de minerais e gorduras saudáveis alinhou o pico hormonal.', []),
      general: buildDomain('general', 79, 'Controlado', 'optimal', 'Leituras variadas', 'Respostas divergentes em pulso e respiração balançam-se equitativamente.', []),
      energy: buildDomain('energy', 55, 'Errática', 'poor', 'Depleção local', 'Quebras notórias na resposta energética do final do dia.', [{ title: 'Mudar Estímulo', actionable: 'Troque a ginástica tardia por leitura antes das 22h.' }]),
      recovery: buildDomain('recovery', 88, 'Afinada', 'optimal', 'Eficiência metabólica na pausa', 'Processamento de resíduos e ácido lático decorreu sem atrito sistémico.', []),
      performance: buildDomain('performance', 76, 'Aceitável', 'fair', 'Capacidade condicional', 'A força de pernas está preservada, as capacidades executivas cerebrais nem tanto.', [])
    }
  } as SemanticOutputState,
};

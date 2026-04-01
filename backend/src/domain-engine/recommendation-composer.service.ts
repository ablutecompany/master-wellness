import { Injectable } from '@nestjs/common';
import { DomainStatus, DomainType, RecommendationItem } from './types';

@Injectable()
export class RecommendationComposerService {
  /**
   * Selecionar recomendações acionáveis baseadas em factos determinísticos.
   * Gating: Zero recomendações em dados insuficientes.
   */
  compose(domain: DomainType, score: any): RecommendationItem[] {
    if (score.status !== 'sufficient_data' || score.band === 'optimal') {
      return []; // Coherence Policy: No recommendations on weak data or perfect score
    }

    const recs: RecommendationItem[] = [];
    const pool = this.getRecommendationPool(domain, score.band);
    
    // Pick top 2 for deterministic UI focus
    return pool.slice(0, 2);
  }

  private getRecommendationPool(domain: DomainType, band: 'fair' | 'poor'): RecommendationItem[] {
    const registry: Record<string, Record<string, RecommendationItem[]>> = {
      sleep: {
        fair: [
          {
            id: 'sleep_hygiene_1',
            type: 'lifestyle',
            title: 'Higiene do Sono',
            bodyShort: 'Evite luz azul 1h antes de deitar.',
            bodyLong: 'A exposição à luz azul interfere com a produção de melatonina, impactando a latência do sono.',
            priorityRank: 1,
            effortLevel: 'low',
            impactLevel: 'medium'
          }
        ],
        poor: [
          {
            id: 'sleep_recovery_1',
            type: 'lifestyle',
            title: 'Protocolo de Recuperação',
            bodyShort: 'Mantenha o quarto a 18°C.',
            bodyLong: 'Uma temperatura ambiente mais baixa facilita a descida da temperatura corporal central, essencial para o sono profundo.',
            priorityRank: 1,
            effortLevel: 'medium',
            impactLevel: 'high'
          }
        ]
      },
      nutrition: {
        fair: [
           {
            id: 'nutri_stable_1',
            type: 'nutrition',
            title: 'Estabilidade Glicémica',
            bodyShort: 'Aumente a ingestão de fibras ao jantar.',
            bodyLong: 'As fibras ajudam a manter a curva de glucose estável durante o período de repouso nocturno.',
            priorityRank: 1,
            effortLevel: 'low',
            impactLevel: 'medium'
          }
        ],
        poor: [
          {
            id: 'nutri_rebalance_1',
            type: 'nutrition',
            title: 'Protocolo Hidratação',
            bodyShort: 'Aumente o consumo de água (+0.5L/dia).',
            bodyLong: 'Os seus marcadores biográficos indicam um estado de hidratação sub-óptimo para a sua carga de atividade.',
            priorityRank: 1,
            effortLevel: 'low',
            impactLevel: 'high'
          }
        ]
      },
      energy: {
        fair: [
          {
            id: 'energy_hydration_1',
            type: 'lifestyle',
            title: 'Reforço Hídrico Intercalar',
            bodyShort: 'Mantenha a hidratação ao longo da tarde.',
            bodyLong: 'O seu perfil energético requer uma estabilidade de fluxo hídrico mais rigorosa.',
            priorityRank: 1,
            effortLevel: 'low',
            impactLevel: 'medium'
          }
        ],
        poor: [
          {
            id: 'energy_rest_1',
            type: 'lifestyle',
            title: 'Gestão de Esforço',
            bodyShort: 'Sugerimos limitar esforços físicos prolongados hoje.',
            bodyLong: 'Os biomarcadores atuais recomendam um dia de atividade mais leve para equilibrar o seu desgaste metabólico subjacente.',
            priorityRank: 1,
            effortLevel: 'low',
            impactLevel: 'high'
          }
        ]
      },
      recovery: {
        fair: [
          {
            id: 'recov_routine_1',
            type: 'lifestyle',
            title: 'Rotina de Relaxamento',
            bodyShort: 'Priorize 15m de abrandamento antes de dormir.',
            bodyLong: 'Um período de transição calmo e isento de sobre-estimulação sensorial ajuda a estabilizar o sistema basal.',
            priorityRank: 1,
            effortLevel: 'low',
            impactLevel: 'medium'
          }
        ],
        poor: [
          {
            id: 'recov_train_1',
            type: 'lifestyle',
            title: 'Gestão Ativa de Carga',
            bodyShort: 'Evite rotinas ou treinos extenuantes nas próximas 24h.',
            bodyLong: 'Os dados apontam para a utilidade em privilegiar a recuperação elástica do stress mecânico antes de aplicar nova carga alta.',
            priorityRank: 1,
            effortLevel: 'medium',
            impactLevel: 'high'
          }
        ]
      },
      performance: {
        fair: [
          {
            id: 'perf_hydro_1',
            type: 'lifestyle',
            title: 'Manutenção de Atividade',
            bodyShort: 'Mantenha a atividade mas garanta re-hidratação constante.',
            bodyLong: 'O stress de performance atual não requer paragem, mas requer suporte nutricional e estabilidade térmica adequados.',
            priorityRank: 1,
            effortLevel: 'low',
            impactLevel: 'medium'
          }
        ],
        poor: [
          {
            id: 'perf_slow_1',
            type: 'lifestyle',
            title: 'Abrandamento Programado',
            bodyShort: 'Opte por atividade de menor intensidade nas próximas 24h.',
            bodyLong: 'A monitorização acusa esforço incompatível com a atual janela de desempenho biográfico otimizado.',
            priorityRank: 1,
            effortLevel: 'low',
            impactLevel: 'high'
          }
        ]
      }
    };

    const domainEntry = registry[domain] || registry['sleep'];
    return domainEntry[band] || [];
  }
}

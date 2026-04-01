import { Injectable } from '@nestjs/common';
import { RecommendationItem, DomainScore, DomainType } from './types';

@Injectable()
export class RecommendationComposerService {
  private readonly pool: Record<string, RecommendationItem[]> = {
    nutrition: [
      { id: 'rec_nut_01', type: 'nutrition', title: 'Aumenta o magnésio', bodyShort: 'Espinafres e amêndoas ajudam na estabilidade.', bodyLong: 'O magnésio é essencial para a função neuromuscular e regulação do humor.', priorityRank: 1, effortLevel: 'low', impactLevel: 'medium' },
      { id: 'rec_nut_02', type: 'nutrition', title: 'Carbohidratos Complexos', bodyShort: 'Aveia e batata doce para energia estável.', bodyLong: 'A libertação lenta de glicose evita picos de insulina e fadiga precoce.', priorityRank: 2, effortLevel: 'medium', impactLevel: 'high' }
    ],
    sleep: [
      { id: 'rec_slp_01', type: 'habit', title: 'Dorme +15min', bodyShort: 'Pequenos incrementos melhoram o seu score.', bodyLong: 'Estudos indicam que 15 minutos extras de sono REM podem aumentar a agilidade mental em 20%.', priorityRank: 1, effortLevel: 'low', impactLevel: 'medium' },
      { id: 'rec_slp_02', type: 'environment', title: 'Bloqueio de luz azul', bodyShort: 'Usa filtros 2h antes de dormir.', bodyLong: 'A luz azul inibe a produção de melatonina, o que prejudica a entrada no sono profundo.', priorityRank: 2, effortLevel: 'low', impactLevel: 'high' }
    ],
    hydration: [
      { id: 'rec_hyd_01', type: 'hydration', title: 'Bebe mais água', bodyShort: 'Fundamental para o transporte de nutrientes.', bodyLong: 'A desidratação leve (1%) pode levar a quedas significativas na concentração e performance.', priorityRank: 3, effortLevel: 'low', impactLevel: 'medium' }
    ]
  };

  compose(domain: DomainType, score: DomainScore): RecommendationItem[] {
    const domainRecs = this.pool[domain] || [];
    const hydrationRecs = this.pool['hydration'] || [];
    
    // Sort and select based on score severity
    const combined = [...domainRecs, ...hydrationRecs]
      .sort((a, b) => a.priorityRank - b.priorityRank)
      .slice(0, 3);

    return combined;
  }
}

import { Injectable } from '@nestjs/common';
import { DomainInsight, DomainScore, DomainType, DomainStatus } from './types';

@Injectable()
export class InsightComposerService {
  private readonly templates: Record<DomainType, (score: number) => string> = {
    energy: (s) => s > 70 
      ? 'A tua carga energética está resiliente.' 
      : 'Os teus drivers de energia sugerem sobrecarga metabólica.',
    recovery: (s) => s > 70
      ? 'A tua regeneração está em níveis ideais.'
      : 'Sinais de recuperação incompleta detetados nos biomarcadores residuais.',
    performance: (s) => s > 75
      ? 'Pico de performance atlética identificado.'
      : 'Capacidade de esforço limitada por fatores de fadiga.',
    sleep: (s) => s > 75
      ? 'Padrão de sono estável e profundo.'
      : 'A qualidade do sono está a comprometer a tua recuperação.',
    nutrition: (s) => s > 70
      ? 'Perfil nutricional equilibrado e funcional.'
      : 'Défice de micronutrientes identificado nos sinais metabólicos.',
    general: (s) => s > 70
      ? 'Bem-estar holístico estável.'
      : 'Equilíbrio funcional abaixo do ideal; requer atenção aos pilares base.'
  };

  compose(domain: DomainType, score: DomainScore, measurements: any[]): DomainInsight[] {
    if (score.status === 'unavailable' || score.status === 'insufficient_data') {
      return [{
        id: `insight_${domain}_empty`,
        summary: 'Dados insuficientes para análise profunda.',
        explanation: 'Ainda não capturamos medições suficientes para gerar um perfil de saúde completo para este domínio.',
        factors: { status: score.status },
        evidenceRefs: [],
        version: '1.2.0',
        tone: 'clinical-light'
      }];
    }

    const summary = this.templates[domain](score.value);
    const explanation = this.generateExplanation(domain, score, measurements);

    return [{
      id: `insight_${domain}_${Date.now()}`,
      summary,
      explanation,
      factors: {
        freshness: score.freshnessPenalty,
        completeness: score.completenessPenalty,
        status: score.status
      },
      evidenceRefs: measurements.map(m => m.id),
      version: '1.2.0',
      tone: 'clinical-light'
    }];
  }

  private generateExplanation(domain: DomainType, score: DomainScore, measurements: any[]): string {
    const strength = score.value > 70 ? 'positivos' : 'limitantes';
    const count = measurements.length;
    return `Com base na análise de ${count} sinais biológicos, identificamos que os teus fatores ${strength} estão a definir o teu estado atual de ${domain}.`;
  }
}

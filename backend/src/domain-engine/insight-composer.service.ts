import { Injectable } from '@nestjs/common';
import { DomainStatus, DomainType, DomainInsight } from './types';

@Injectable()
export class InsightComposerService {
  /**
   * Compor narrativas de saúde baseadas em factos determinísticos.
   * Puro, sem LLM, sem texto aleatório.
   */
  compose(domain: DomainType, score: any, measurements: any[]): DomainInsight[] {
    if (score.status === 'unavailable' || score.status === 'insufficient_data') {
      return [{
        id: `insufficient_${domain}`,
        summary: `Dados de ${domain} insuficientes`,
        explanation: `Ainda não temos medições suficientes para gerar um diagnóstico biográfico em ${domain}. Continue a usar os seus equipamentos para desbloquear este ecrã.`,
        tone: 'informative',
        factors: [],
        version: '1.2.0'
      }];
    }

    const insights: DomainInsight[] = [];
    const mainInsight = this.getMainInsight(domain, score.band);
    if (mainInsight) insights.push(mainInsight);

    // Adicionar factores biográficos baseados em medições reais
    const criticalBiomarkers = measurements.filter(m => m.valueNumeric < 20 || m.valueNumeric > 80);
    if (criticalBiomarkers.length > 0) {
      insights.push({
        id: `biomarker_alert_${domain}`,
        summary: `Factores Críticos Detectados`,
        explanation: `Identificamos variações significativas em ${criticalBiomarkers.map(b => b.code).join(', ')}. Isto pode estar a impactar o seu score de ${domain}.`,
        tone: 'alert',
        factors: criticalBiomarkers.map(b => b.code),
        version: '1.2.0'
      });
    }

    return insights;
  }

  private getMainInsight(domain: DomainType, band: 'optimal' | 'fair' | 'poor'): DomainInsight | null {
    const registry: Record<string, Record<string, { summary: string; explanation: string }>> = {
      sleep: {
        optimal: { summary: 'Sono Restaurador', explanation: 'A sua qualidade de sono está no nível ideal para recuperação biológica.' },
        fair: { summary: 'Sono Estável', explanation: 'O seu sono é regular, mas há espaço para optimizar a profundidade.' },
        poor: { summary: 'Sono Fragmentado', explanation: 'Identificamos interrupções que estão a comprometer a sua recuperação.' }
      },
      nutrition: {
        optimal: { summary: 'Equilíbrio Metabólico', explanation: 'Os seus níveis de glucose e hidratação estão em harmonia.' },
        fair: { summary: 'Dieta Baseline', explanation: 'A sua base nutricional está estável, mas sugere-se ajuste fino.' },
        poor: { summary: 'Stress Nutricional', explanation: 'Os sinais biográficos indicam desequilíbrio na ingestão de nutrientes chave.' }
      },
      general: {
        optimal: { summary: 'Wellness Holístico', explanation: 'Todos os sistemas biográficos estão a operar em níveis ótimos.' },
        fair: { summary: 'Modo Manutenção', explanation: 'O seu estado geral é bom, mantendo o rastro operacional.' },
        poor: { summary: 'Fadiga Biológica', explanation: 'O seu score geral indica necessidade imediata de foco em recuperação.' }
      },
      energy: {
        optimal: { summary: 'Energia Adequada', explanation: 'A sua reserva energética está num bom nível, suportada de forma sustentável.' },
        fair: { summary: 'Energia Estável', explanation: 'A sua resposta metabólica e hidratação sustentam a atividade diária regular.' },
        poor: { summary: 'Sinais de Energia Reduzida', explanation: 'Variações nos biomarcadores sugerem que convém reduzir a carga e privilegiar a recuperação.' }
      },
      recovery: {
        optimal: { summary: 'Recuperação Adequada', explanation: 'Os marcadores indicam que a sua recuperação celular e descanso estão num rasto positivo e equilibrado.' },
        fair: { summary: 'Recuperação Estável', explanation: 'O seu padrão biográfico de descanso é aceitável, permitindo a manutenção da rotina normal.' },
        poor: { summary: 'Sinais de Recuperação Incompleta', explanation: 'Detetámos sinais contínuos de que convém abrandar a carga física e privilegiar tempo de repouso.' }
      },
      performance: {
        optimal: { summary: 'Desempenho Adequado', explanation: 'Os indicadores demonstram uma capacidade física e gestão de esforço sustentáveis.' },
        fair: { summary: 'Desempenho Estável', explanation: 'O seu perfil biomarcador e carga atual indiciam um esforço regular.' },
        poor: { summary: 'Sinais de Desempenho Reduzido', explanation: 'Convém ajustar a carga biográfica e gerir melhor o esforço face aos dados recolhidos.' }
      }
    };

    const domainEntry = registry[domain] || registry['general'];
    const entry = domainEntry[band];

    if (!entry) return null;

    return {
      id: `${domain}_${band}_main`,
      summary: entry.summary,
      explanation: entry.explanation,
      tone: band === 'poor' ? 'alert' : 'supportive',
      factors: [],
      version: '1.2.0'
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from './scoring.service';
import { InsightComposerService } from './insight-composer.service';
import { RecommendationComposerService } from './recommendation-composer.service';
import { CrossDomainCoherenceService } from './cross-domain-coherence.service';
import { DomainType, DomainSemanticOutput, DomainSemanticBundle, DomainStatus, DomainAuditTrace } from './types';

@Injectable()
export class DomainEngineService {
  constructor(
    private prisma: PrismaService,
    private scoringService: ScoringService,
    private insightComposer: InsightComposerService,
    private recommendationComposer: RecommendationComposerService,
  ) {}

  /**
   * Gerar o bundle semântico consolidado (v1.2.0).
   * Implementa a Política B: Placeholder determinístico para domínios não solicitados.
   */
  async generateBundle(userId: string, requestedDomains?: DomainType[]): Promise<DomainSemanticBundle> {
    const allDomains: DomainType[] = ['sleep', 'nutrition', 'general', 'energy', 'recovery', 'performance'];
    const processedDomains: DomainType[] = [];
    const outputs: Record<string, DomainSemanticOutput> = {};

    // 1. Fetch relevant signals (biometric evidence)
    const measurements = await this.prisma.normalizedMeasurement.findMany({
      where: { session: { userId } },
      orderBy: { capturedAt: 'desc' },
      distinct: ['code'],
    });

    for (const domain of allDomains) {
      // ── POLÍTICA DE PRESERVAÇÃO PARCIAL ──
      // Se requestedDomains vier preenchido, só recomputamos os pedidos.
      const shouldRecompute = !requestedDomains || requestedDomains.includes(domain);
      
      if (shouldRecompute) {
        outputs[domain] = await this.processDomain(domain, measurements);
        processedDomains.push(domain);
      } else {
        // Opção B: Placeholder compatível (Garante estabilidade na shell)
        outputs[domain] = this.createStalePlaceholder(domain);
      }
    }

    const auditTrace: DomainAuditTrace = {
      requestedDomains: requestedDomains || ['all'],
      processedDomains,
      engineVersion: '1.2.0',
      timestamp: Date.now()
    };

    // CAMADA 2: COERÊNCIA (HARMONIZATION)
    // Avalia o pool gerado e expurga contradições
    const coherence = CrossDomainCoherenceService.harmonize(outputs);

    if (coherence.coherenceFlags.includes('GENERAL_OVERLY_OPTIMISTIC')) {
      if (outputs['general'] && outputs['general'].insights && outputs['general'].insights.length > 0) {
        outputs['general'].insights[0].summary = 'Estado Geral c/ Reservas Periféricas';
        outputs['general'].insights[0].explanation = 'Os sinais vitais de base estabilizam, mas sistemas específicos acusam stress e mitigam um otimismo clínico geral.';
      }
    }

    return {
      bundleVersion: '1.2.0',
      generatedAt: Date.now(),
      userId,
      domains: outputs,
      coherenceFlags: [...coherence.coherenceFlags, 'multi_domain_sync_active', 'partial_bundle_v1_2_op_b'],
      crossDomainSummary: coherence,
      auditTrace
    };
  }

  private async processDomain(domain: DomainType, allMeasurements: any[]): Promise<DomainSemanticOutput> {
    const score = this.scoringService.calculate(domain, allMeasurements);
    const insights = this.insightComposer.compose(domain, score, allMeasurements);
    const recommendations = this.recommendationComposer.compose(domain, score);

    const evidence = allMeasurements.map(m => ({
      biomarkerCode: m.code,
      value: m.valueNumeric,
      unit: m.unit,
      capturedAt: m.capturedAt,
      state: m.valueNumeric > 80 ? 'optimal' : m.valueNumeric > 40 ? 'borderline' : 'critical'
    }));

    return {
      domain,
      version: '1.2.0',
      generatedAt: Date.now(),
      lastComputedAt: Date.now(),
      isStale: false,
      score,
      insights,
      recommendations,
      evidence: (evidence as any[]).slice(0, 5),
      trace: []
    };
  }

  /**
   * Criação de Placeholder Determinístico (Opção B).
   * Evita reutilização de valores obsoletos sem prova de frescura.
   */
  private createStalePlaceholder(domain: DomainType): DomainSemanticOutput {
    return {
      domain,
      version: '1.2.0',
      generatedAt: 0, 
      lastComputedAt: 0,
      isStale: true, // SINALIZADOR OPERACIONAL CLARO
      score: {
        value: 0,
        stateLabel: 'Revalidação Requerida', // PT-PT Centralizado
        band: 'poor',
        confidence: 0,
        freshnessPenalty: 1,
        completenessPenalty: 0,
        status: 'stale'
      },
      insights: [],
      recommendations: [],
      evidence: [],
      trace: ['op_b_placeholder']
    };
  }
}

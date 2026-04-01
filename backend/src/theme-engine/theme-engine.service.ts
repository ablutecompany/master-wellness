import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../domain-engine/scoring.service';
import { InsightComposerService } from '../domain-engine/insight-composer.service';
import { RecommendationComposerService } from '../domain-engine/recommendation-composer.service';
import { DomainType } from '../domain-engine/types';

@Injectable()
export class ThemeEngineService {
  constructor(
    private prisma: PrismaService,
    private scoringService: ScoringService,
    private insightComposer: InsightComposerService,
    private recommendations: RecommendationComposerService
  ) {}

  private getThemeWeights(themeCode: string): Record<string, number> {
    const weightsMap: Record<string, Record<string, number>> = {
      energy: { glucose: 0.3, urea: 0.2, sodium: 0.2, potassium: 0.1, hydration: 0.2 },
      recovery: { urea: 0.4, creatinine: 0.2, sleep_quality: 0.4 },
      performance: { glucose: 0.3, hydration: 0.2, activity_load: 0.5 },
    };
    return weightsMap[themeCode] || { base: 1.0 };
  }

  async getThemeBundle(userId: string): Promise<any> {
    const domains: DomainType[] = ['sleep', 'nutrition', 'general', 'energy', 'recovery', 'performance'];
    const bundle: Record<string, any> = {};

    for (const d of domains) {
       bundle[d] = await this.calculateScore(userId, d);
    }

    return {
      bundleVersion: '1.2.0',
      generatedAt: Date.now(),
      userId,
      domains: bundle,
      coherenceFlags: ['multi_domain_sync_active']
    };
  }

  async calculateScore(userId: string, themeCode: string, sessionId?: string) {
    const theme = await this.prisma.themeDefinition.findUnique({ where: { code: themeCode } });
    if (!theme) throw new Error('Theme not found');

    // 1. Fetch relevant signals (latest normalized measurements)
    const measurements = await this.prisma.normalizedMeasurement.findMany({
      where: { session: { userId } },
      orderBy: { capturedAt: 'desc' },
      distinct: ['code'],
    });

    // 2. Specialized Scoring (Layer 6)
    const scoreOutput = this.scoringService.calculate(themeCode as DomainType, measurements);

    const componentsData = measurements.map(m => ({
      type: 'biomarker',
      code: m.code,
      weight: 1.0, // Simplified for legacy component storage
      effectDirection: 1,
      valueSummary: `${m.valueNumeric}${m.unit}`,
      contributionScore: Math.round(m.valueNumeric),
    }));

    // 4. Persistence
    const themeScore = await this.prisma.themeScore.create({
      data: {
        userId,
        definitionId: theme.id,
        value: scoreOutput.value,
        stateLabel: scoreOutput.stateLabel,
        band: scoreOutput.band,
        version: '1.2.0',
        confidence: scoreOutput.confidence,
        sessionId,
        dataWindow: { 
          period: '7d', 
          signalsCaptured: measurements.length,
          freshnessPenalty: scoreOutput.freshnessPenalty,
          completenessPenalty: scoreOutput.completenessPenalty 
        },
        components: { create: componentsData as any },
      },
    });

    // 5. specialized Insight Composition (Layer 5)
    await this.generateInsights(themeScore.id, userId, themeCode as DomainType, scoreOutput, measurements);

    // 6. Specialized Recommendation Selection (Layer 4)
    await this.generateRecommendations(themeScore.id, userId, themeCode as DomainType, scoreOutput);

    return themeScore;
  }

  private async generateInsights(scoreId: string, userId: string, domain: DomainType, score: any, measurements: any[]) {
    const insights = this.insightComposer.compose(domain, score, measurements);
    
    for (const insight of insights) {
      await this.prisma.themeInsight.create({
        data: {
          userId,
          scoreId,
          summaryShort: insight.summary,
          explanationLong: insight.explanation,
          explanationFactors: insight.factors as any,
          language: 'pt-PT',
          version: insight.version,
          tone: insight.tone,
        },
      });
    }
  }

  private async generateRecommendations(scoreId: string, userId: string, domain: DomainType, score: any) {
    if (score.status === 'insufficient_data' || score.status === 'unavailable') {
      console.log(`[Domain Engine] Skipping recommendations for ${domain} due to: ${score.status}`);
      return; // Coherence Policy: No recommendations on weak data
    }
    
    const recs = this.recommendations.compose(domain, score);
    
    for (const rec of recs) {
      await this.prisma.recommendation.create({
        data: {
          userId,
          scoreId,
          type: rec.type,
          title: rec.title,
          bodyShort: rec.bodyShort,
          bodyLong: rec.bodyLong,
          priorityRank: rec.priorityRank,
          effortLevel: rec.effortLevel,
          impactLevel: rec.impactLevel,
          version: '1.2',
        },
      });
    }
  }


  async getUserThemes(userId: string) {
    return this.prisma.themeScore.findMany({
      where: { userId },
      include: { definition: true, insights: true },
      orderBy: { generatedAt: 'desc' },
    });
  }
}

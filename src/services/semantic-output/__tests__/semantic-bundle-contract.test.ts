import { validateSemanticBundleShape } from '../../schema-validators';
import readyFixture from '../__fixtures__/semantic-bundle.ready.json';
import staleFixture from '../__fixtures__/semantic-bundle.partial-stale.json';
import { CrossDomainCoherenceService } from '../../../../backend/src/domain-engine/cross-domain-coherence.service';
import energyReadyFixture from '../__fixtures__/semantic-bundle.energy-ready.json';
import energyInsufficientFixture from '../__fixtures__/semantic-bundle.energy-insufficient.json';
import recoveryReadyFixture from '../__fixtures__/semantic-bundle.recovery-ready.json';
import recoveryInsufficientFixture from '../__fixtures__/semantic-bundle.recovery-insufficient.json';
import performanceReadyFixture from '../__fixtures__/semantic-bundle.performance-ready.json';
import performanceInsufficientFixture from '../__fixtures__/semantic-bundle.performance-insufficient.json';

describe('Contrato Central do Backend: Semantic Bundle Shape', () => {

  it('o fixture ready cumpre o schema rigoroso', () => {
    // Prova de shape compliance
    expect(validateSemanticBundleShape(readyFixture)).toBe(true);
    
    // Prova de facticidade de estado interno (Não drift)
    expect(readyFixture.status).toBe('ready');
    const sleepDomain = (readyFixture.domains as any)['sleep'];
    
    expect(sleepDomain.status).toBe('ready');
    expect(sleepDomain.isStale).toBe(false);
    expect(sleepDomain.mainInsight).toHaveProperty('summary');
    expect(sleepDomain.mainInsight).toHaveProperty('description');
  });

  it('o fixture parcial-stale cumpre regras de estagnação de estado independente', () => {
    expect(validateSemanticBundleShape(staleFixture)).toBe(true);

    const sleepDomain = (staleFixture.domains as any)['sleep'];
    const nutritionDomain = (staleFixture.domains as any)['nutrition'];

    // Prova coexistence of ready and stale states sem corromper o main bundle
    expect(sleepDomain.status).toBe('ready');
    expect(sleepDomain.isStale).toBe(false);

    expect(nutritionDomain.status).toBe('stale');
    expect(nutritionDomain.isStale).toBe(true);
  });

  it('valida estruturalmente o domínio energy (incluindo fallbacks data-less)', () => {
    // 1. Prova do estado Ready puro com texto factual no energy
    expect(validateSemanticBundleShape(energyReadyFixture)).toBe(true);
    const engReady = (energyReadyFixture.domains as any)['energy'];
    expect(engReady.status).toBe('ready');

    // 2. Prova de insufficient_data sem colapsar a estrutura
    expect(validateSemanticBundleShape(energyInsufficientFixture)).toBe(true);
    const engMiss = (energyInsufficientFixture.domains as any)['energy'];
    expect(engMiss.status).toBe('insufficient_data');
  });

  it('valida estruturalmente o domínio recovery', () => {
    // 1. Prova do estado Ready puro com texto factual no recovery
    expect(validateSemanticBundleShape(recoveryReadyFixture)).toBe(true);
    const recReady = (recoveryReadyFixture.domains as any)['recovery'];
    expect(recReady.status).toBe('ready');

    // 2. Prova de insufficient_data na pipeline de recuperação
    expect(validateSemanticBundleShape(recoveryInsufficientFixture)).toBe(true);
    const recMiss = (recoveryInsufficientFixture.domains as any)['recovery'];
    expect(recMiss.status).toBe('insufficient_data');
  });

  it('valida estruturalmente o domínio performance', () => {
    // 1. Prova do estado Ready puro com texto factual no performance
    expect(validateSemanticBundleShape(performanceReadyFixture)).toBe(true);
    const perfReady = (performanceReadyFixture.domains as any)['performance'];
    expect(perfReady.status).toBe('ready');

    // 2. Prova de insufficient_data na pipeline de desempenho
    expect(validateSemanticBundleShape(performanceInsufficientFixture)).toBe(true);
    const perfMiss = (performanceInsufficientFixture.domains as any)['performance'];
    expect(perfMiss.status).toBe('insufficient_data');
  });

  it('valida a coerência e deduplicação transversal (Cross Domain)', () => {
    // Simulamos um output bruto onde Performance e Energy têm recomendações semelhantes
    // Ambos dizem "abrandar" com id ou body idênticos/repetidos
    const fakeRawDomains: any = {
      general: { score: { value: 90 } },
      energy: {
        score: { value: 50 },
        recommendations: [{ id: 'rest_1', bodyShort: 'Descanse', priorityRank: 1, impactLevel: 'medium' }]
      },
      performance: {
        score: { value: 40 },
        recommendations: [{ id: 'rest_1', bodyShort: 'Descanse e hidrate', priorityRank: 2, impactLevel: 'high' }]
      }
    };

    const coherence = CrossDomainCoherenceService.harmonize(fakeRawDomains);

    // Rule 1 actua? General (90) é Overly Optimistic porque energy (50) & perf (40) estao sub-60
    expect(coherence.coherenceFlags).toContain('GENERAL_OVERLY_OPTIMISTIC');
    
    // Deduplicação
    // 'rest_1' duplicado entre Energy e Performance. Devia fundir e ficar com 1.
    expect(coherence.deduplicatedRecommendations.length).toBe(1);
    
    // Upgrade de prioridade por override (impactLevel high ganhou)
    expect(coherence.deduplicatedRecommendations[0].impactLevel).toBe('high');
  });

  it('validador descarta (drift) se detetar propriedades legacy ou estados estranhos', () => {
    const dirtyDrift = {
      status: 'ready',
      globalScore: 80, // legacy property
      domains: {}
    };

    expect(validateSemanticBundleShape(dirtyDrift)).toBe(false);

    const unknownStatusDrift = {
      status: 'generating', // status inválido -> error 
      domains: {}
    };

    expect(validateSemanticBundleShape(unknownStatusDrift)).toBe(false);
  });
});

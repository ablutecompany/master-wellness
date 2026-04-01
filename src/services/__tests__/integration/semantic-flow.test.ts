import { SemanticOutputStore } from '../../semantic-output/store';
import { getSemanticInsights } from '../../insights/index';
import { semanticOutputService } from '../../semantic-output/index';

describe('Integration Flow: Semantic Lifecycle & Presenter Pipeline', () => {

  const originalDev = __DEV__;

  beforeEach(() => {
    // Silencia erros nos testes onde propositadamente testamos falhas
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (global as any).__DEV__ = false; 

    // Reset ao estado interno da Store entre testes
    SemanticOutputStore.updateState({
      status: 'idle',
      domains: {},
      isLive: false
    });
  });

  afterAll(() => {
    (global as any).__DEV__ = originalDev;
    jest.restoreAllMocks();
  });

  it('Flow A: Bundle Misto (1 Ready, 2 Stale). Presenter compila títulos corretos e isStale não colapsa a UI.', () => {
    // 1. Simulação do Backend -> Store (Lifecycle)
    SemanticOutputStore.updateState({
      status: 'stale', // Global status
      domains: {
        sleep: {
          domain: 'sleep',
          status: 'ready',
          statusLabel: 'Normal',
          score: 80,
          isStale: true, // Stale!
          mainInsight: { summary: 'Dormiste ok', description: '' }
        } as any,
        nutrition: {
          domain: 'nutrition',
          status: 'stale',
          statusLabel: 'Pendente',
          isStale: true
        } as any,
        general: {
          domain: 'general',
          status: 'ready',
          statusLabel: 'Equilibrado',
          score: 75,
          isStale: false, // Fresco!
          mainInsight: { summary: 'Tudo equilibrado', description: '' }
        } as any,
        energy: {
          domain: 'energy',
          status: 'ready',
          statusLabel: 'Vigor Estável',
          score: 95,
          isStale: false,
          mainInsight: { summary: 'Energia Adequada', description: 'Bom nível.' }
        } as any,
        recovery: {
          domain: 'recovery',
          status: 'ready',
          statusLabel: 'Recuperado',
          score: 90,
          isStale: true,
          mainInsight: { summary: 'Recuperação Adequada', description: 'Equilíbrio de repouso.' }
        } as any,
        performance: {
          domain: 'performance',
          status: 'ready',
          statusLabel: 'Estável',
          score: 85,
          isStale: false,
          mainInsight: { summary: 'Desempenho Adequada', description: 'Pronto a atuar.' }
        } as any
      }
    });

    // 2. Apresentação (Adapter/Presenter)
    const insights = getSemanticInsights();
    
    const sleep = insights.find(i => i.domain === 'sleep');
    const nutrition = insights.find(i => i.domain === 'nutrition');
    const general = insights.find(i => i.domain === 'general');
    const energy = insights.find(i => i.domain === 'energy');
    const recovery = insights.find(i => i.domain === 'recovery');
    const performance = insights.find(i => i.domain === 'performance');

    // Asserções Integradas Ponto-a-Ponto
    // General estava Ready e fresco
    expect(general?.status).toBe('ready');
    expect(general?.paragraph1).toBe('Tudo equilibrado');
    expect(general?.isStale).toBe(false);

    // Energy ativado perfeitamente no novo contrato E2E
    expect(energy?.status).toBe('ready');
    expect(energy?.paragraph1).toBe('Energia Adequada');
    expect(energy?.paragraph2).toBe('Bom nível.');

    // Recovery test (stale mutation)
    // Era "ready" mas estava Stale -> deve virar "stale" e exibir revalidação e não o summary
    expect(recovery?.status).toBe('stale');
    expect(recovery?.isStale).toBe(true);
    expect(recovery?.paragraph1).toBe('Revalidação Necessária');

    // Performance test
    expect(performance?.status).toBe('ready');
    expect(performance?.paragraph1).toBe('Desempenho Adequada');

    // Sleep estava Ready no backend mas isStale = true. O Presenter MUTA para stale e usa copy PT-PT de revalidação.
    expect(sleep?.status).toBe('stale');
    expect(sleep?.isStale).toBe(true);
    expect(sleep?.paragraph1).toBe('Revalidação Necessária');

    // Nutrition era logo Stale de nascença
    expect(nutrition?.status).toBe('stale');
    expect(nutrition?.paragraph1).toBe('Revalidação Necessária');
  });

  it('Flow B: Lifecycle Global Indisponível (insufficient_data)', () => {
    SemanticOutputStore.updateState({
      status: 'insufficient_data',
      domains: {
        sleep: { status: 'insufficient_data', isStale: false } as any,
        energy: { status: 'insufficient_data', isStale: false } as any
      }
    });

    const insights = getSemanticInsights();
    const sleep = insights.find(i => i.domain === 'sleep');
    const energy = insights.find(i => i.domain === 'energy');

    expect(sleep?.status).toBe('insufficient_data');
    expect(sleep?.paragraph1).toBe('Dados Insuficientes');

    expect(energy?.status).toBe('insufficient_data');
    expect(energy?.refText2).toBe('A Aguardar');
  });

  it('Flow C: Fallbacks de Produção quando o Pipeline Falha ou quebra o Guardrail', () => {
    // Store tem um domain 'ready' mas esqueceu-se do insight! (Violacao factual)
    SemanticOutputStore.updateState({
      status: 'ready',
      domains: {
        sleep: { status: 'ready', score: 90 } as any // Sem mainInsight
      }
    });

    // No fluxo real: presenter pede ao service -> Service pede store e CORRE C/ guardrail
    // Guardrail nota falha, e como __DEV__ = false, ele converte em 'error' silenciado
    const insights = getSemanticInsights();
    const sleep = insights.find(i => i.domain === 'sleep');

    // Presenter deve ter recebido a mutação do Guardrail e formatado o ecrã para ERRO
    expect(sleep?.status).toBe('error');
    expect(sleep?.paragraph1).toBe('Serviço Indisponível'); 
    
    // Prova de que error (falha técnica) não se confunde com insufficient_data
    expect(sleep?.paragraph1).not.toBe('Dados Insuficientes');
  });

});

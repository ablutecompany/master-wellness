import { getSemanticInsights } from '../index';
import { semanticOutputService } from '../../semantic-output/index';

jest.mock('../../semantic-output/index', () => {
  const mockBundleDb = jest.fn();
  return {
    semanticOutputService: {
      getBundle: mockBundleDb,
      getStatus: jest.fn(),
      getDomainOutput: jest.fn().mockImplementation((d) => mockBundleDb()?.domains?.[d]),
    }
  };
});

describe('Insights Service (UI Adapter)', () => {

  const mockGetBundle = semanticOutputService.getBundle as jest.Mock;

  it('deve distinguir estado error de insufficient_data com copy diferente (PT-PT)', () => {
    mockGetBundle.mockReturnValue({
      domains: {
        sleep: { status: 'error', isStale: false },
        nutrition: { status: 'insufficient_data', isStale: false },
        general: { status: 'insufficient_data', isStale: false }
      }
    });

    const insights = getSemanticInsights();
    
    const sleep = insights.find(i => i.domain === 'sleep');
    const nutrition = insights.find(i => i.domain === 'nutrition');

    // Erro Técnico vs Dados Insuficientes
    expect(sleep?.status).toBe('error');
    expect(sleep?.paragraph1).toBe('Serviço Indisponível');
    expect(sleep?.refText2).toBe('Falha Técnica');

    expect(nutrition?.status).toBe('insufficient_data');
    expect(nutrition?.paragraph1).toBe('Dados Insuficientes');
    expect(nutrition?.refText2).toBe('A Aguardar');

    // Confirmamos que não houve colapso
    expect(sleep?.paragraph1).not.toBe(nutrition?.paragraph1);
  });

  it('deve tratar stale de forma controlada', () => {
      mockGetBundle.mockReturnValue({
        domains: {
          sleep: { status: 'stale', isStale: true }, // ou sufficient_data mas isStale: true
          nutrition: { status: 'unavailable' },
          general: { status: 'unavailable' }
        }
      });
  
      const insights = getSemanticInsights();
      const sleep = insights.find(i => i.domain === 'sleep');
  
      expect(sleep?.status).toBe('stale');
      expect(sleep?.isStale).toBe(true);
      expect(sleep?.paragraph1).toBe('Revalidação Necessária');
  });

  it('deve formatar estado ready perfeitamente', () => {
    mockGetBundle.mockReturnValue({
      domains: {
        sleep: {
          status: 'ready',
          isStale: false,
          score: 85,
          mainInsight: { summary: 'Dormiste bem', description: 'Oteu padrão indica boa recuperação.' },
          recommendations: [{ title: 'Dica', actionable: 'Continua' }]
        },
        nutrition: { status: 'unavailable' },
        general: { status: 'unavailable' }
      }
    });

    const insights = getSemanticInsights();
    const sleep = insights.find(i => i.domain === 'sleep');

    expect(sleep?.status).toBe('ready');
    expect(sleep?.paragraph1).toBe('Dormiste bem');
    expect(sleep?.suggestions?.[0]?.title).toBe('Dica');
    expect(sleep?.suggestions?.[0]?.desc).toBe('Continua');
});

});

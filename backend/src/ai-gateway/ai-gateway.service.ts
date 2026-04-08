import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/**
 * Service minimalista que gera insights estruturados via OpenAI Responses API.
 * Utiliza json_schema para garantir output robusto e faz dump do objeto bruto.
 */
@Injectable()
export class AiGatewayService {
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY não está definida');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Gera insights a partir do contexto de análise ativo.
   * Retorna o objeto já validado em `response.data`.
   */
  async generateInsights(activeAnalysisContext: {
    analysisId: string;
    selectedDate: string;
    measurements: any[];
    events: any[];
    ecosystemFacts: any[];
    isDemo: boolean;
    demoScenarioKey?: string;
  }): Promise<any> {
    const prompt = `
Recebe o contexto da análise abaixo e gera um relatório estruturado em JSON com os campos:
  headline, summary, domains (energia_disponibilidade, recuperacao_resiliencia, digestao_trato_intestinal, ritmo_renovacao) e suggestions (lista de strings).
Utiliza linguagem neutra e natural em português de Portugal. Não te dirijas ao utilizador.
Contexto da análise (JSON):
${JSON.stringify(activeAnalysisContext, null, 2)}
`;

    const insightsSchema = {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        summary: { type: 'string' },
        domains: {
          type: 'object',
          properties: {
            energia_disponibilidade: { type: 'string' },
            recuperacao_resiliencia: { type: 'string' },
            digestao_trato_intestinal: { type: 'string' },
            ritmo_renovacao: { type: 'string' },
          },
          required: [
            'energia_disponibilidade',
            'recuperacao_resiliencia',
            'digestao_trato_intestinal',
            'ritmo_renovacao',
          ],
        },
        suggestions: { type: 'array', items: { type: 'string' } },
      },
      required: ['headline', 'summary', 'domains', 'suggestions'],
      additionalProperties: false,
    };

    try {
      // @ts-ignore – typings for responses ainda podem faltar
      const response: any = await (this.openai as any).responses.create({
        model: 'gpt-5.4-mini',
        input: prompt,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'Insights', strict: true, schema: insightsSchema },
        },
      });

      // Dump completo do objeto retornado pelo SDK
      console.dir(response, { depth: null });

      // O JSON estruturado está em response.data
      return { status: 'success', payload: response.data };
    } catch (err) {
      console.error('Erro ao gerar insights via OpenAI:', err);
      throw new InternalServerErrorException('Falha ao gerar insights: ' + (err as Error).message);
    }
  }
}

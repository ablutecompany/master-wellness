import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateInsightsDto } from './dto/generate-insights.dto';

/**
 * Gera insights estruturados via OpenAI Responses API.
 * Retorna shape canónico normalizado — nunca expõe o objecto cru do provider.
 */
@Injectable()
export class AiGatewayService {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não está definida');
    }
    this.openai = new OpenAI({ apiKey });
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
  }

  private readonly insightsSchema = {
    type: 'object' as const,
    properties: {
      headline: { type: 'string' as const },
      summary: { type: 'string' as const },
      domains: {
        type: 'object' as const,
        properties: {
          energia_disponibilidade: { type: 'string' as const },
          recuperacao_resiliencia: { type: 'string' as const },
          digestao_trato_intestinal: { type: 'string' as const },
          ritmo_renovacao: { type: 'string' as const },
        },
        required: [
          'energia_disponibilidade',
          'recuperacao_resiliencia',
          'digestao_trato_intestinal',
          'ritmo_renovacao',
        ],
        additionalProperties: false,
      },
      suggestions: { type: 'array' as const, items: { type: 'string' as const } },
    },
    required: ['headline', 'summary', 'domains', 'suggestions'],
    additionalProperties: false,
  };

  async generateInsights(
    dto: GenerateInsightsDto,
  ): Promise<{ ok: true; provider: string; model: string; insight: any; meta: any }> {
    const startMs = Date.now();

    const prompt = [
      'Recebe o contexto da análise abaixo e gera um relatório estruturado em JSON.',
      'Campos obrigatórios: headline, summary, domains (energia_disponibilidade, recuperacao_resiliencia, digestao_trato_intestinal, ritmo_renovacao), suggestions (lista de strings).',
      'Utiliza linguagem neutra e natural em português de Portugal. Não te dirijas ao utilizador.',
      '',
      'Contexto da análise (JSON):',
      JSON.stringify(dto, null, 2),
    ].join('\n');

    try {
      // OpenAI Responses API — SDK >=6.x
      const response: any = await (this.openai as any).responses.create({
        model: this.model,
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: 'Insights',
            strict: true,
            schema: this.insightsSchema,
          },
        },
      });

      const execMillis = Date.now() - startMs;

      // ── Parsing determinístico de duas camadas ──────────────────────
      let rawText = response?.output_text;
      let source = 'output_text';

      // Fallback defensivo: extrair do array output se output_text vier vazio
      if (!rawText && response?.output && Array.isArray(response.output)) {
        this.logger.debug('output_text vazio, a tentar extrair do array output...');
        rawText = response.output
          .filter((item: any) => item.content && Array.isArray(item.content))
          .flatMap((item: any) => item.content)
          .filter((c: any) => c.type === 'output_text')
          .map((c: any) => c.text)
          .join('\n');
        source = 'output_array';
      }

      if (!rawText) {
        this.logger.error(
          'Falha total de parsing: output_text e output_array vazios. Chaves: ' +
            Object.keys(response || {}).join(', '),
        );
        throw new AiGatewayError('PARSE_FAILED', 'Provider não devolveu texto legível');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        this.logger.error(`JSON inválido de ${source}: ${rawText.slice(0, 500)}`);
        throw new AiGatewayError('PARSE_FAILED', `O texto de ${source} não é JSON válido`);
      }

      // Validação mínima dos campos obrigatórios
      const required = ['headline', 'summary', 'domains', 'suggestions'];
      const missing = required.filter((k) => !(k in parsed));
      if (missing.length > 0) {
        this.logger.error(`Campos em falta no insight (${source}): ${missing.join(', ')}`);
        throw new AiGatewayError('SCHEMA_MISMATCH', `Campos obrigatórios em falta: ${missing.join(', ')}`);
      }

      this.logger.log(
        `Insight gerado [source=${source}] em ${execMillis}ms | model=${response.model || this.model} | tokens=${response.usage?.total_tokens ?? '?'}`
      );

      return {
        ok: true,
        provider: 'openai',
        model: response.model || this.model,
        insight: parsed,
        meta: {
          execMillis,
          tokensUsed: response.usage?.total_tokens ?? null,
          inputTokens: response.usage?.input_tokens ?? null,
          outputTokens: response.usage?.output_tokens ?? null,
          finishReason: response.status ?? null,
          parsingSource: source,
        },
      };
    } catch (err) {
      const execMillis = Date.now() - startMs;
      const error = err as any;

      // Classificação de erros simplificada
      const code = this.classifyError(error);

      this.logger.error(
        `Falha ao gerar insights [${code}] em ${execMillis}ms: ${error.message || error}`,
      );

      throw new AiGatewayError(code, error.message || 'Erro inesperado do provider', {
        execMillis,
        model: this.model,
      });
    }
  }

  private classifyError(err: any): string {
    if (err instanceof AiGatewayError) return err.code;
    const msg = (err.message || '').toLowerCase();
    const status = err.status || err.statusCode || 0;
    
    if (status === 401 || msg.includes('api key')) return 'AUTH_FAILED';
    if (status === 429 || msg.includes('rate limit')) return 'RATE_LIMITED';
    if (status === 400 || msg.includes('schema') || msg.includes('invalid')) return 'INVALID_REQUEST';
    if (status === 404 || msg.includes('model')) return 'MODEL_NOT_FOUND';
    if (msg.includes('timeout') || msg.includes('econnrefused')) return 'PROVIDER_UNREACHABLE';
    
    return 'PROVIDER_ERROR';
  }
}

/**
 * Erro normalizado do AI Gateway.
 * O controller converte-o em response canónico.
 */
export class AiGatewayError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'AiGatewayError';
  }
}

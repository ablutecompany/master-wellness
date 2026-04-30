import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { PrismaService } from '../prisma/prisma.service';
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
  private readonly PROMPT_VERSION = '2.0.0-canonical-r2';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
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
      summary: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          status: { type: 'string' as const, enum: ['stable', 'attention', 'caution', 'insufficient_data'] },
          text: { type: 'string' as const },
          confidence: {
            type: 'object' as const,
            properties: {
              label: { type: 'string' as const, enum: ['alta', 'moderada', 'baixa'] },
              score: { type: 'number' as const }
            },
            required: ['label', 'score'],
            additionalProperties: false
          }
        },
        required: ['title', 'status', 'text', 'confidence'],
        additionalProperties: false
      },
      dimensions: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            id: { type: 'string' as const, enum: ['energy_availability', 'recovery_load', 'hydration_urinary_balance', 'intestinal_state', 'vital_signs_physiological_balance', 'signal_oriented_nutrition', 'stress_focus_self_regulation', 'watch_signals'] },
            label: { type: 'string' as const },
            shortLabel: { type: 'string' as const },
            score: { type: 'number' as const },
            status: { type: 'string' as const, enum: ['ótimo', 'estável', 'cautela', 'atenção', 'insuficiente'] },
            messageTitle: { type: 'string' as const },
            messageText: { type: 'string' as const },
            primaryRecommendation: { type: 'string' as const },
            recommendations: {
              type: 'array' as const,
              items: {
                type: 'object' as const,
                properties: {
                  title: { type: 'string' as const },
                  text: { type: 'string' as const },
                  priority: { type: 'string' as const, enum: ['alta', 'média', 'baixa'] },
                  actionability: { type: 'string' as const, enum: ['imediata', 'próximas horas', 'próximas leituras'] }
                },
                required: ['title', 'text', 'priority', 'actionability'],
                additionalProperties: false
              }
            },
            grounding: {
              type: 'object' as const,
              properties: {
                confidenceLabel: { type: 'string' as const, enum: ['alta', 'moderada', 'baixa'] },
                confidenceScore: { type: 'number' as const },
                usedFamilies: { type: 'array' as const, items: { type: 'string' as const, enum: ['urina', 'fezes', 'fisiológicos', 'contexto', 'histórico'] } },
                usedSignals: {
                  type: 'array' as const,
                  items: {
                    type: 'object' as const,
                    properties: {
                      label: { type: 'string' as const },
                      value: { type: 'string' as const },
                      contribution: { type: 'string' as const }
                    },
                    required: ['label', 'value', 'contribution'],
                    additionalProperties: false
                  }
                },
                reasoning: { type: 'string' as const },
                limitations: { type: 'array' as const, items: { type: 'string' as const } }
              },
              required: ['confidenceLabel', 'confidenceScore', 'usedFamilies', 'usedSignals', 'reasoning', 'limitations'],
              additionalProperties: false
            }
          },
          required: ['id', 'label', 'shortLabel', 'score', 'status', 'messageTitle', 'messageText', 'primaryRecommendation', 'recommendations', 'grounding'],
          additionalProperties: false
        }
      },
      globalReferences: {
        type: 'object' as const,
        properties: {
          freshness: { type: 'string' as const, enum: ['recente', 'moderada', 'antiga'] },
          origin: { type: 'string' as const, enum: ['real', 'simulação'] },
          engine: { type: 'string' as const, enum: ['openai', 'local', 'fallback'] },
          usedDataFamilies: { type: 'array' as const, items: { type: 'string' as const, enum: ['urina', 'fezes', 'fisiológicos'] } },
          limitations: { type: 'array' as const, items: { type: 'string' as const } }
        },
        required: ['freshness', 'origin', 'engine', 'usedDataFamilies', 'limitations'],
        additionalProperties: false
      }
    },
    required: ['summary', 'dimensions', 'globalReferences'],
    additionalProperties: false,
  };

  async generateInsights(
    dto: GenerateInsightsDto,
  ): Promise<{ ok: true; provider: string; model: string; insight: any; meta: any }> {
    // 1. VERIFICAÇÃO DE CACHE (PERSISTÊNCIA) — M5 Fatia 3
    if (!dto.isDemo && dto.analysisId) {
      const existing = await this.prisma.analysisInsight.findFirst({
        where: { analysisId: dto.analysisId, status: 'ready' },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        this.logger.log(`Insight reutilizado da DB para análise ${dto.analysisId}`);
        return {
          ok: true,
          provider: existing.provider,
          model: existing.model,
          insight: existing.outputJson,
          meta: {
            cached: true,
            persistedId: existing.id,
            promptVersion: existing.promptVersion,
            createdAt: existing.createdAt,
          },
        };
      }
    }

    const startMs = Date.now();

    const prompt = [
      `A Leitura AI é uma camada interpretativa prudente baseada nos Resultados disponíveis na plataforma ablute_ wellness.`,
      `A Leitura AI NÃO é diagnóstico.`,
      ``,
      `A AI deve:`,
      `- usar apenas os dados recebidos no input;`,
      `- não inventar biomarcadores, histórico ou contexto;`,
      `- não tirar conclusões clínicas fechadas;`,
      `- explicar o que usou para construir a leitura;`,
      `- declarar insuficiência quando os dados forem fracos, mas explicando de forma útil o valor da repetição;`,
      `- produzir texto útil, humano, prudente e acionável em PT-PT.`,
      ``,
      `A AI deve evitar frases pobres e genéricas como "Dados insuficientes.", "Estabilidade cardiovascular.", "A aguardar convergência factual.".`,
      `Se houver poucos dados, explica a limitação de forma útil e acionável.`,
      ``,
      `REGRAS DE ESCRITA:`,
      `- Tom: claro, técnico sem ser denso, prudente, útil, não alarmista, não paternalista.`,
      `- Usar termos como: "sugere", "parece compatível", "pode estar relacionado", "merece observação".`,
      `- Não diagnosticar (nunca usar: "tem infeção", "tem diabetes", "deve fazer tratamento", etc).`,
      `- Não usar linguagem vaga ("equilíbrio celular", "vetores", "ecossistema biográfico").`,
      ``,
      `AS 8 DIMENSÕES OBRIGATÓRIAS (Gera as 8, nunca omitas nenhuma):`,
      `1. energy_availability (Energia & disponibilidade) - Pode usar: sono, recuperação, hr, ppg, stress, carga.`,
      `2. recovery_load (Recuperação & carga) - Pode usar: sono, recuperação, hr, ppg, stress.`,
      `3. hydration_urinary_balance (Hidratação & equilíbrio urinário) - Pode usar: densidade urinária, pH, eletrólitos.`,
      `4. intestinal_state (Estado intestinal) - Pode usar: Bristol, fezes. Nunca usar sangue oculto ou diagnosticar.`,
      `5. vital_signs_physiological_balance (Sinais vitais & equilíbrio fisiológico) - Pode usar: hr, spo2, temperatura. Não interpretar ECG clinicamente.`,
      `6. signal_oriented_nutrition (Nutrição orientada por sinais) - Pistas prudentes. Não fazer plano alimentar.`,
      `7. stress_focus_self_regulation (Stress, foco & autorregulação) - Prontidão, não avaliação psicológica.`,
      `8. watch_signals (Sinais a acompanhar) - O que repetir ou vigiar.`,
      ``,
      `Se não houver dados para uma dimensão, gera score=50, status="insuficiente", e escreve texto útil explicando que aguarda dados.`,
      ``,
      `Contexto da análise (JSON):`,
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
            name: 'InsightsR2',
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

      // Validação mínima dos campos obrigatórios do R2
      const required = ['summary', 'dimensions', 'globalReferences'];
      const missing = required.filter((k) => !(k in parsed));
      if (missing.length > 0) {
        this.logger.error(`Campos em falta no insight (${source}): ${missing.join(', ')}`);
        throw new AiGatewayError('SCHEMA_MISMATCH', `Campos obrigatórios em falta: ${missing.join(', ')}`);
      }

      this.logger.log(
        `Insight gerado [source=${source}] em ${execMillis}ms | model=${response.model || this.model} | tokens=${response.usage?.total_tokens ?? '?'}`
      );

      // 3. PERSISTÊNCIA REAL — M5 Fatia 3
      if (!dto.isDemo && dto.analysisId) {
        try {
          await this.prisma.analysisInsight.create({
            data: {
              analysisId: dto.analysisId,
              provider: 'openai',
              model: response.model || this.model,
              promptVersion: this.PROMPT_VERSION,
              outputJson: parsed as any,
              summaryText: parsed.summary?.text || null,
            },
          });
          this.logger.log(`Insight persistido na DB para análise ${dto.analysisId}`);
        } catch (dbErr) {
          this.logger.error(`Falha ao persistir insight: ${dbErr.message}`);
          // Não bloqueamos a resposta se a escrita falhar, mas logamos o erro.
        }
      }

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
          promptVersion: this.PROMPT_VERSION,
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

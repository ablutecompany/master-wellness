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
          text: { type: 'string' as const },
          confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] }
        },
        required: ['title', 'text', 'confidence'],
        additionalProperties: false
      },
      dimensions: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            id: { type: 'string' as const, enum: ['energy_availability', 'recovery_load', 'hydration_urinary_balance', 'intestinal_state', 'vital_signs_physiological_balance'] },
            label: { type: 'string' as const },
            score: { type: 'number' as const },
            explanation: { type: 'string' as const },
            supportingFacts: { type: 'array' as const, items: { type: 'string' as const } },
            confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] }
          },
          required: ['id', 'label', 'score', 'explanation', 'supportingFacts', 'confidence'],
          additionalProperties: false
        }
      },
      highlightedThemes: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            id: { type: 'string' as const },
            title: { type: 'string' as const },
            status: { type: 'string' as const, enum: ['stable', 'attention', 'insufficient_data'] },
            explanation: { type: 'string' as const },
            supportingFacts: { type: 'array' as const, items: { type: 'string' as const } },
            suggestedAction: { type: 'string' as const },
            confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
            limitations: { type: 'array' as const, items: { type: 'string' as const } }
          },
          required: ['id', 'title', 'status', 'explanation', 'supportingFacts', 'suggestedAction', 'confidence', 'limitations'],
          additionalProperties: false
        }
      },
      priorityActions: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const },
            reason: { type: 'string' as const },
            priority: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
            supportingFacts: { type: 'array' as const, items: { type: 'string' as const } },
            domain: { type: 'string' as const, enum: ['hydration', 'recovery', 'nutrition', 'stress', 'monitoring', 'general'] }
          },
          required: ['title', 'reason', 'priority', 'supportingFacts', 'domain'],
          additionalProperties: false
        }
      },
      watchSignals: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const },
            explanation: { type: 'string' as const },
            reasonToRepeat: { type: 'string' as const }
          },
          required: ['title', 'explanation', 'reasonToRepeat'],
          additionalProperties: false
        }
      },
      references: {
        type: 'object' as const,
        properties: {
          usedDataFamilies: { type: 'array' as const, items: { type: 'string' as const } },
          usedSignals: { type: 'array' as const, items: { type: 'string' as const } },
          freshness: { type: 'string' as const, enum: ['fresh', 'usable_with_warning', 'stale', 'unavailable'] },
          confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
          limitations: { type: 'array' as const, items: { type: 'string' as const } }
        },
        required: ['usedDataFamilies', 'usedSignals', 'freshness', 'confidence', 'limitations'],
        additionalProperties: false
      },
      readingLimits: { type: 'array' as const, items: { type: 'string' as const } }
    },
    required: ['summary', 'dimensions', 'highlightedThemes', 'priorityActions', 'watchSignals', 'references', 'readingLimits'],
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
      `És um motor de interpretação de dados biológicos para a plataforma ablute_ wellness.`,
      `Recebes dados de análises laboratoriais e fisiológicas de um utilizador e devolves uma leitura estruturada em JSON (Leitura AI R2).`,
      ``,
      `REGRAS OBRIGATÓRIAS:`,
      `- Escreve em português de Portugal (PT-PT), tom técnico, contido e elegante.`,
      `- Usa a 3.ª pessoa ou construções impessoais. Nunca uses "você" ou "deves".`,
      `- Não faças diagnósticos nem prescrições. Não uses frases do tipo "tens X condição" ou "sofres de Y".`,
      `- Não cries causalidades inventadas sem suporte explícito nos dados.`,
      `- Sem linguagem de marketing ("potencial", "otimizar", "biohacking").`,
      `- Sem inglês user-facing. Usa sempre os labels exatos em PT-PT.`,
      `- Sem pseudo-ciência. Baseia-te apenas em mecanismos fisiológicos documentados.`,
      `- Sem menção direta a "sangue oculto nas fezes" (usa termos como integridade gastrointestinal).`,
      `- Sê prudente quando há poucos dados. Explicita essa limitação se aplicável.`,
      `- Não contradijas os dados. Se um marcador for negativo/normal, o status não é problemático.`,
      `- As ações sugeridas (priorityActions) devem ser práticas e não farmacológicas por defeito. Máximo 3 ações.`,
      `- Máximo de 5 temas em destaque (highlightedThemes).`,
      `- Para campos string não obrigatórios ou ausentes num contexto estruturado, usa "".`,
      ``,
      `EIXOS/DOMÍNIOS A AVALIAR (Usa exatamente estes labels na UI):`,
      `1. Energia & disponibilidade (id: energy_availability)`,
      `2. Recuperação & carga (id: recovery_load)`,
      `3. Hidratação & equilíbrio urinário (id: hydration_urinary_balance)`,
      `4. Estado intestinal (id: intestinal_state)`,
      `5. Sinais vitais & equilíbrio fisiológico (id: vital_signs_physiological_balance)`,
      `6. Nutrição orientada por sinais (usado em priorityActions ou themes)`,
      `7. Stress, foco & autorregulação (usado em priorityActions ou themes)`,
      `8. Sinais a acompanhar (usado em watchSignals)`,
      ``,
      `CAMPOS DO SCHEMA:`,
      `- summary.title: frase curta e forte (máx 15 palavras).`,
      `- summary.text: 2-3 frases coerentes sintetizando a leitura global.`,
      `- dimensions: Array apenas com os 5 eixos principais (1 a 5 descritos acima). Atribui um 'score' de 0 a 100 baseado na adequação fisiológica.`,
      `- highlightedThemes: Temas de maior relevância atual (inclui eixos 1-7). Define status (stable | attention | insufficient_data) e suggestedAction ("" se não houver).`,
      `- priorityActions: Máximo 3 sugestões de ação não farmacológicas, indicando 'domain' e 'priority'.`,
      `- watchSignals: Aspectos a observar em análises futuras (eixo 8).`,
      `- references / readingLimits: Preenche conforme o contexto analítico fornecido e limites do modelo.`,
      ``,
      `FALLBACK E LIMITES:`,
      `- Se faltarem dados vitais/sono/urina, reflete essa ausência na confidence (baixa) ou status (insufficient_data).`,
      `- limits: Inclui sempre avisos de que não é diagnóstico clínico.`,
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
      const required = ['summary', 'dimensions', 'highlightedThemes', 'priorityActions', 'watchSignals', 'references', 'readingLimits'];
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

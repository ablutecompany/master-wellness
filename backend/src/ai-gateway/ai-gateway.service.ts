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
  private readonly PROMPT_VERSION = '1.0.0-canonical';

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
      `Recebes dados de análises laboratoriais e fisiológicas de um utilizador e devolves uma leitura estruturada em JSON.`,
      ``,
      `REGRAS OBRIGATÓRIAS:`,
      `- Escreve em português de Portugal, tom técnico e contido.`,
      `- Usa a 3.ª pessoa ou construções impessoais. Nunca uses "você" ou "deves".`,
      `- Não faças diagnósticos. Não uses frases do tipo "tens X condição" ou "sofres de Y".`,
      `- Não faças prognósticos nem promessas de resultados.`,
      `- Não uses linguagem alarmista. Valores fora dos parâmetros são referidos com precisão, sem dramatismo.`,
      `- Não uses linguagem vaga: proibido "optimização", "biohacking", "potencial", "elevar".`,
      `- Não contradijas os dados recebidos. Se um marcador vier como "negativo" ou "normal", não o interpretes como problemático.`,
      `- Se os dados de um domínio forem insuficientes ou ausentes, afirma isso claramente: "Dados insuficientes para interpretação deste domínio."`,
      `- Não menciones que os dados são uma demonstração ou simulação.`,
      `- As sugestões devem ser práticas, curtas e não farmacológicas por defeito. Nunca recomandes medicamentos, suplementos ou intervenções clínicas.`,
      `- Máximo de 4 sugestões. Só inclui mais de 2 se os dados justificarem claramente.`,
      ``,
      `CAMPOS OBRIGATÓRIOS:`,
      `- headline: frase curta e forte (10-15 palavras), síntese de leitura global.`,
      `- summary: 2-3 frases coerentes que lêem o conjunto de marcadores disponíveis.`,
      `- domains.energia_disponibilidade: 1-2 frases sobre energia metabólica e disponibilidade funcional deduzida dos dados.`,
      `- domains.recuperacao_resiliencia: 1-2 frases sobre capacidade de recuperação autonómica e resiliência fisiológica.`,
      `- domains.digestao_trato_intestinal: 1-2 frases sobre padrões digestivos e integridade gastrointestinal deduzida.`,
      `- domains.ritmo_renovacao: 1-2 frases sobre ciclos de regeneração, sono registado (se disponível) e renovação celular.`,
      `- suggestions: lista de strings com sugestões práticas e não farmacológicas.`,
      ``,
      `FALLBACK SEMÂNTICO:`,
      `- Sem dados de sono: escreve "Sem dados de sono disponíveis para avaliar ritmo de renovação."`,
      `- Sem dados fisiológicos (ECG, PPG, temperatura): escreve "Dados fisiológicos não disponíveis para este domínio."`,
      `- Sem medições urinárias: escreve "Análise urinária ausente — domínio digestivo com dados insuficientes."`,
      `- Menos de 2 marcadores: o headline deve reflectir a escassez de dados sem criar uma leitura falsa.`,
      ``,
      `LIMITES — O QUE NÃO DEVES AFIRMAR:`,
      `- Não afirmes que o utilizador está saudável ou doente.`,
      `- Não uses "bom" ou "mau" sem referência ao contexto clínico específico.`,
      `- Não atribuas causas aos valores (ex: "o pH baixo deve-se a...").`,
      `- Não afirmes que uma tendência se vai manter ou inverter.`,
      `- Não cries interpretações cruzadas entre domínios sem suporte nos dados.`,
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
              summaryText: parsed.summary || null,
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

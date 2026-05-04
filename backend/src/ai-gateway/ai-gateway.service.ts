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
  private readonly PROMPT_VERSION = '2.1.0-canonical-r5d.1';

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
      nutrientSuggestions: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            nutrient: { type: 'string' as const },
            reason: { type: 'string' as const },
            foodExamples: { type: 'array' as const, items: { type: 'string' as const } },
            linkedTo: { type: 'string' as const },
            confidence: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
            caution: { type: 'string' as const }
          },
          required: ['nutrient', 'reason', 'foodExamples', 'linkedTo', 'confidence', 'caution'],
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
    required: ['summary', 'dimensions', 'nutrientSuggestions', 'globalReferences'],
    additionalProperties: false,
  };

  private readonly insightsSchemaV2 = {
    type: 'object' as const,
    properties: {
      summary: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          body: { type: 'string' as const },
          focusDimensionId: { type: 'string' as const },
          focusReason: { type: 'string' as const },
          practicalOrientation: { type: 'string' as const }
        },
        required: ['title', 'body', 'focusDimensionId', 'focusReason', 'practicalOrientation'],
        additionalProperties: false
      },
      dimensions: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            id: { type: 'string' as const, enum: ['energy', 'recovery', 'internal_balance', 'metabolic_rhythm', 'intestinal_state', 'food_adjustments', 'physiological_load', 'vitality'] },
            label: { type: 'string' as const },
            type: { type: 'string' as const, enum: ['momentary', 'functional', 'longitudinal'] },
            score: { type: 'number' as const },
            state: { type: 'string' as const, enum: ['stable', 'watch', 'priority', 'insufficient'] },
            stateLabel: { type: 'string' as const, enum: ['Estável', 'Atenção', 'Prioritário', 'Insuficiente'] },
            confidence: { type: 'string' as const, enum: ['low', 'medium', 'high', 'insufficient'] },
            summary: { type: 'string' as const },
            actions: { type: 'array' as const, items: { type: 'string' as const } },
            referencesIntro: { type: 'string' as const, enum: ['Entre outras, esta avaliação considerou:'] },
            references: { type: 'array' as const, items: { type: 'string' as const } },
            limits: { type: 'string' as const }
          },
          required: ['id', 'label', 'type', 'score', 'state', 'stateLabel', 'confidence', 'summary', 'actions', 'referencesIntro', 'references', 'limits'],
          additionalProperties: false
        }
      },
      safety: {
        type: 'object' as const,
        properties: {
          isMedicalDiagnosis: { type: 'boolean' as const },
          warnings: { type: 'array' as const, items: { type: 'string' as const } }
        },
        required: ['isMedicalDiagnosis', 'warnings'],
        additionalProperties: false
      }
    },
    required: ['summary', 'dimensions', 'safety'],
    additionalProperties: false,
  };

  async generateInsightsV2(body: any, userId?: string): Promise<{ ok: true; provider: string; model: string; insight: any; meta: any }> {
    const startMs = Date.now();
    const { activeMemberId, analysisSessionId, forceRegenerate, sourcePayload } = body;
    const isDemo = sourcePayload?.isDemo === true;
    
    const dimensionsCount = sourcePayload?.dimensions ? Object.keys(sourcePayload.dimensions).length : 0;
    
    this.logger.log(`[R5C9_AI_V2_PAYLOAD_SERVER] requestReceived=true | hasAuth=${!!userId} | isDemo=${isDemo} | analysisSessionId=${analysisSessionId} | analysisSessionIdIsNull=${analysisSessionId == null} | hasSourcePayload=${!!sourcePayload} | hasContextV2=true | hasDimensions=${dimensionsCount > 0} | dimensionsCount=${dimensionsCount} | bodyKeys=${Object.keys(body).join(',')}`);
    
    
    const hasAuth = !!userId;
    
    this.logger.log(`[R5C6_AI_V2_SERVER] requestReceived=true | hasAuth=${hasAuth} | isDemo=${isDemo} | willCallOpenAI=${hasAuth}`);

    if (!hasAuth) {
       throw new AiGatewayError('UNAUTHORIZED', 'Autenticação obrigatória para utilizar a IA Avançada. (401)');
    }

    // 1. Identificar Source Hash com versionamento R6.2
    const promptVersion = 'R6.2';
    const hashStr = sourcePayload ? Buffer.from(JSON.stringify(sourcePayload)).toString('base64').substring(0, 32) + '_' + promptVersion : 'unknown_' + promptVersion;
    
    // 2. Verificar cache se forceRegenerate=false e não for DEMO
    if (!forceRegenerate && !isDemo) {
       let cached;
       if (analysisSessionId) {
          cached = await this.prisma.aiReadingRecord.findFirst({
             where: { analysisSessionId, status: 'completed' },
             orderBy: { generatedAt: 'desc' }
          });
       } else {
          cached = await this.prisma.aiReadingRecord.findFirst({
             where: { sourceSnapshotHash: hashStr, status: 'completed' },
             orderBy: { generatedAt: 'desc' }
          });
       }

       if (cached && cached.themesJson && (cached.themesJson as any[]).length > 0) {
          this.logger.log(`[R5C6_AI_V2_SERVER] cacheHit=true | sourceSnapshotHash=${hashStr.substring(0,8)} | openaiCalled=false | prismaCreateAttempted=false`);
          return {
            ok: true,
            provider: 'cached',
            model: cached.model,
            insight: {
              overallNarrative: cached.narrative,
              shortSummary: cached.themesJson[0]?.refinedSummary || '',
              dimensions: cached.themesJson,
              globalRecommendations: cached.recommendationsJson,
              limitations: cached.limitationsJson ? (cached.limitationsJson as any).limitations || [] : [],
              safetyFlags: cached.safetyFlagsJson || [],
              nutrientPriorities: (cached.nutrientSuggestionsJson as any)?.nutrientPriorities || []
            },
            meta: {
              execMillis: 0,
              cached: true,
              engineSource: 'cached',
              savedRecordId: cached.id
            }
          };
       }
    }

    this.logger.log(`[R5C1_OPENAI_GUARD] engineSource=backend_openai_v2 | cached=false | hasAuth=${hasAuth} | isDemo=${isDemo} | willCallOpenAI=true`);

    const prompt = [
      `És a camada de redação interpretativa da Leitura AI da app ablute_ wellness.`,
      `A tua função é transformar um objeto estruturado de inferência wellness numa leitura clara, útil, prudente e personalizada em português de Portugal.`,
      ``,
      `Não és médico. Não fazes diagnóstico. Não inferes doença. Não recomendas medicação. Não recomendas suplementação como primeira linha.`,
      `Não inventas dados.`,
      ``,
      `[REGRA CRÍTICA - NÃO ALTERAR DADOS LOCAIS]:`,
      `A OpenAI NÃO deve ser o motor livre de decisão. Deves manter exatamente os valores recebidos para: score, state, stateLabel, confidence, id, e label.`,
      `Estes campos são calculados pelo motor local e a tua tarefa é apenas preservá-los no output JSON final, e redigir texto à volta deles.`,
      `Não apresentas como usado um dado marcado como missing ou excluded_by_user. Não contradizes o estado da dimensão.`,
      ``,
      `A resposta deve ser sempre JSON válido, sem markdown, sem texto antes ou depois.`,
      ``,
      `REGRAS OBRIGATÓRIAS:`,
      `1. SÍNTESE DO MOMENTO: A síntese deve ser específica da leitura. Deve conter: estado geral, foco principal, 1 a 2 drivers reais e orientação prática. Proibido: texto genérico institucional, "Análise de Bem-Estar de [nome]", "exploramos múltiplas dimensões", "cada dimensão fornece uma visão...", "Resumo pendente OpenAI", frases que servem para qualquer pessoa, e dizer que está tudo bem se houver dimensões em Atenção/Prioritário.`,
      `2. REGRAS POR ESTADO:`,
      `   - Estável: tom tranquilo; reforçar manutenção; não exagerar; não dizer "perfeito".`,
      `   - Atenção: tom prudente; indicar o que merece acompanhamento; sugerir ajuste simples; não alarmar.`,
      `   - Prioritário: indicar prioridade prática; sugerir repetir leitura ou reduzir carga; se persistir, sugerir avaliação profissional; sem diagnóstico.`,
      `   - Insuficiente: explicar que não tem dados suficientes; indicar o que falta; não inventar score nem interpretação forte.`,
      `3. FONTES (sourcePolicy): "used" = pode usar. "missing" = indicar ausência se relevante. "excluded_by_user" = nunca usar dados dessa fonte, reduzir confiança ou explicar limite.`,
      `4. REFERÊNCIAS: referencesIntro deve ser exatamente "Entre outras, esta avaliação considerou:". references devem ser 1 a 3 linhas compreensíveis (ex: "Densidade urinária: ajudou a avaliar a concentração da urina."). Não repetir "entre outras" em cada referência. Não usar labels crus como fC Otimizada, camelCase, nem jargões como "impacta negativamente".`,
      `5. AÇÕES: 2 a 4 ações por dimensão, específicas, coerentes com estado, sem diagnóstico, sem suplementação prioritária.`,
      `6. HISTÓRICO/VITALIDADE: Se history.available = false, não inventar tendência e indicar que a leitura é limitada. Vitalidade baixa não é mau; pode ser carga temporária.`,
      `7. DEMO/CONVIDADO: Se isDemo = true, escrever como simulação mas variar conteúdo. Se não houver histórico, confiança mais baixa e explicar que se baseia apenas na sessão.`,
      ``,
      `DIMENSÕES CANÓNICAS (preservar IDs originais e dados base):`,
      `energy, recovery, internal_balance, metabolic_rhythm, intestinal_state, food_adjustments, physiological_load, vitality.`,
      ``,
      `Contexto estrutural recebido do motor local (JSON) - FONTE DE VERDADE ABSOLUTA:`,
      JSON.stringify(sourcePayload, null, 2),
    ].join('\\n');

    try {
      this.logger.log(`[R5C6_AI_V2_SERVER] cacheHit=false | sourceSnapshotHash=${hashStr.substring(0,8)} | openaiCalled=true`);
      const response: any = await (this.openai as any).responses.create({
        model: this.model,
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: 'InsightsV2',
            strict: true,
            schema: this.insightsSchemaV2,
          },
        },
      });

      const execMillis = Date.now() - startMs;
      let rawText = response?.output_text;
      let source = 'output_text';

      if (!rawText && response?.output && Array.isArray(response.output)) {
        rawText = response.output
          .filter((item: any) => item.content && Array.isArray(item.content))
          .flatMap((item: any) => item.content)
          .filter((c: any) => c.type === 'output_text')
          .map((c: any) => c.text)
          .join('\n');
        source = 'output_array';
      }

      if (!rawText) throw new AiGatewayError('PARSE_FAILED', 'Provider não devolveu texto legível');

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new AiGatewayError('PARSE_FAILED', 'JSON inválido devolvido pelo provider');
      }

      if (isDemo && (!parsed.safetyFlags || !parsed.safetyFlags.includes('demo_data'))) {
         parsed.safetyFlags = parsed.safetyFlags || [];
         parsed.safetyFlags.push('demo_data');
      }

      // Persist to ai_readings table
      let savedRecordId: string | undefined;
      try {
         const limitationsObj = isDemo 
             ? { notice: "demo_data_not_for_real_longitudinal_use" } 
             : { execMillis, tokensUsed: response.usage?.total_tokens };

         const record = await this.prisma.aiReadingRecord.create({
           data: {
             userId: userId || 'unauthenticated-demo',
             activeMemberId: activeMemberId || 'default',
             analysisSessionId: analysisSessionId || null,
             sourceSnapshotHash: hashStr,
             sourceSnapshotJson: sourcePayload as object,
             analysisDate: sourcePayload?.analysisDate ? new Date(sourcePayload.analysisDate) : new Date(),
             language: 'pt-PT',
             promptVersion: '2.0.0',
             model: response.model || this.model,
             contractVersion: '2.0.0',
             status: 'completed',
             themesJson: parsed.dimensions || [],
             narrative: parsed.overallNarrative || '',
             recommendationsJson: parsed.globalRecommendations || [],
             nutrientSuggestionsJson: {
                nutrientPriorities: sourcePayload?.nutrientPriorities || [],
                generatedAt: new Date().toISOString(),
                sourceOrigin: isDemo ? "demo" : "real",
                confidence: "medium",
                excludeFromRealPlanning: isDemo
             },
             longitudinalNotesJson: [],
             limitationsJson: limitationsObj,
             safetyFlagsJson: parsed.safetyFlags || []
           }
         });
         savedRecordId = record.id;
         this.logger.log(`[R5C6_AI_V2_SERVER] prismaCreateAttempted=true | savedRecordId=${savedRecordId}`);
      } catch (dbErr) {
         this.logger.error(`[R5C6_AI_V2_SERVER] prismaCreateAttempted=true | errorCode=DB_PERSIST_ERROR | errorMessage=${dbErr.message}`);
      }

      this.logger.log(`[R5C6_AI_V2_SERVER] SUCESSO | isDemo=${isDemo} | savedRecordId=${savedRecordId || 'NONE'} | execMs=${execMillis}`);

      return {
        ok: true,
        provider: 'openai',
        model: response.model || this.model,
        insight: parsed,
        meta: {
          execMillis,
          tokensUsed: response.usage?.total_tokens ?? null,
          promptVersion: '2.0.0',
          engineSource: 'backend_openai_v2',
          savedRecordId
        },
      };
    } catch (err: any) {
      throw new AiGatewayError(this.classifyError(err), err.message || 'Erro V2');
    }
  }

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
      dto.isDemo ? `[ALERTA DE SISTEMA]: Os dados desta leitura são simulados/demo e não representam uma medição real do utilizador. A resposta deve tratar o cenário como uma simulação, referindo-se aos 'dados simulados' em vez de dados reais.` : ``,
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
      `4. intestinal_state (Estado intestinal) - Pode usar: Bristol, caracterização ótica. Não tirar inferências clínicas fechadas nem sugerir patologias.`,
      `5. vital_signs_physiological_balance (Sinais vitais & equilíbrio fisiológico) - Pode usar: hr, spo2, temperatura. Não interpretar ECG clinicamente.`,
      `6. signal_oriented_nutrition (Nutrição orientada por sinais) - Pistas prudentes. Não fazer plano alimentar.`,
      `7. stress_focus_self_regulation (Stress, foco & autorregulação) - Prontidão, não avaliação psicológica.`,
      `8. watch_signals (Sinais a acompanhar) - O que repetir ou vigiar.`,
      ``,
      `Se não houver dados para uma dimensão, gera score=50, status="insuficiente", e escreve texto útil explicando que aguarda dados.`,
      ``,
      `NUTRIENTES (nutrientSuggestions):`,
      `Deves sugerir nutrientes alimentares baseados na análise (ex: Potássio, Magnésio, Proteína, Ómega-3, Fibra).`,
      `- Não sugiras suplementos, dá alimentos concretos.`,
      `- Liga ao contexto da análise.`,
      `- Se dados insuficientes, usa confidence="low" e explica a limitação.`,
      `- Não inventes défices.`,
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
    if (status === 400 || msg.includes('schema') || msg.includes('invalid')) return 'OPENAI_INVALID_REQUEST';
    if (status === 404 || msg.includes('model')) return 'MODEL_NOT_FOUND';
    if (msg.includes('timeout') || msg.includes('econnrefused')) return 'PROVIDER_UNREACHABLE';
    
    return 'PROVIDER_ERROR';
  }

  /**
   * Método híbrido (R4A) para persistência segura
   */
  async generateOrReuseAiReading(body: any, currentUserId: string) {
    const { analysisSessionId, activeMemberId, forceRegenerate, sourcePayload } = body;
    
    // 1. Procurar leitura existente se analysisSessionId for válido e forceRegenerate for falso
    if (analysisSessionId && !forceRegenerate) {
      const existing = await this.prisma.aiReadingRecord.findFirst({
        where: { analysisSessionId }
      });
      if (existing) return existing;
    }

    // 2. Procurar leitura existente baseada em hash do sourcePayload se não usar DB Session
    const hashStr = sourcePayload ? Buffer.from(JSON.stringify(sourcePayload)).toString('base64').substring(0, 32) : 'unknown';
    if (!analysisSessionId && !forceRegenerate && sourcePayload) {
       const existingByHash = await this.prisma.aiReadingRecord.findFirst({
         where: { sourceSnapshotHash: hashStr }
       });
       if (existingByHash) return existingByHash;
    }

    // 3. Montar dados para a AI
    let finalPayload: GenerateInsightsDto;
    let finalHashStr = hashStr;

    if (analysisSessionId && !sourcePayload) {
      // Modo DB_SESSION
      if (!currentUserId) {
         // DB_SESSION exige Auth.
         throw new AiGatewayError('UNAUTHORIZED', 'Autenticação obrigatória para acesso à DB_SESSION (401)');
      }

      const analysis = await this.prisma.analysis.findUnique({
        where: { id: analysisSessionId },
        include: { measurements: true, events: true }
      });

      if (!analysis) {
        throw new AiGatewayError('NOT_FOUND', 'Análise não encontrada na BD (404)');
      }

      // Validação de segurança R4C (propriedade / autorização)
      if (currentUserId && analysis.ownerId !== currentUserId) {
        // Se currentUserId existir e não for dono
        // Verificar se é activeMemberId partilhado (fora do scope atual)
        throw new AiGatewayError('FORBIDDEN', 'Análise não pertence ao utilizador autenticado (403)');
      }

      finalPayload = this.buildAiReadingInputFromAnalysis(analysis, activeMemberId);
      finalHashStr = Buffer.from(JSON.stringify(finalPayload)).toString('base64').substring(0, 32);

      // Nova tentativa de cache agora que temos a Hash real vinda da BD
      if (!forceRegenerate) {
        const existingDbSession = await this.prisma.aiReadingRecord.findFirst({
           where: { sourceSnapshotHash: finalHashStr, analysisSessionId }
        });
        if (existingDbSession) {
          return { ...existingDbSession, cached: true };
        }
      }

    } else {
      // Modo Híbrido PAYLOAD_SNAPSHOT: usamos o payload enviado pelo frontend, mas guardamos de forma estruturada.
      // Limites de Segurança R4C:
      if (!sourcePayload || !Array.isArray(sourcePayload.measurements)) {
        throw new AiGatewayError('INVALID_REQUEST', 'Payload inválido ou vazio no modo snapshot');
      }
      
      // Sanitização básica
      finalPayload = {
        ...sourcePayload,
        userId: currentUserId || 'unauthenticated', // Nunca confiar na origem do cliente
      };
    }

    // 4. Gerar insights chamando o método atual
    const result = await this.generateInsights(finalPayload);
    
    // 5. Mapear para AiReadingRecord e guardar
    if (result.ok) {
       // Flag demo data
       const isSimulated = finalPayload.isDemo === true;
       const limitationsObj = isSimulated 
           ? { ...result.meta, notice: "demo_data_not_for_real_longitudinal_use" } 
           : result.meta;

       const record = await this.prisma.aiReadingRecord.create({
         data: {
           userId: currentUserId || 'unauthenticated-r4c',
           activeMemberId: activeMemberId || 'default',
           analysisSessionId: analysisSessionId || null,
           sourceSnapshotHash: hashStr,
           sourceSnapshotJson: finalPayload as object,
           analysisDate: finalPayload.selectedDate ? new Date(finalPayload.selectedDate) : null,
           language: 'pt-PT',
           promptVersion: '1.0',
           model: result.model,
           contractVersion: '1.0',
           status: 'completed',
           themesJson: result.insight.dimensions || [],
           narrative: result.insight.summary?.text || '',
           recommendationsJson: result.insight.priorityActions || [],
           nutrientSuggestionsJson: result.insight.nutrientSuggestions || [],
           longitudinalNotesJson: [],
           limitationsJson: limitationsObj,
           safetyFlagsJson: isSimulated ? ["demo_data"] : []
         }
       });
       return record;
    }

    throw new AiGatewayError('GENERATION_FAILED', 'Falha ao gerar leitura com OpenAI');
  }

  /**
   * Obtém o histórico longitudinal de leituras AI do utilizador.
   * Por defeito, exclui leituras geradas em modo DEMO/simulação para não contaminar estatísticas reais.
   */
  async getAiReadingHistory(userId: string, options?: { includeDemo?: boolean }) {
    const includeDemo = options?.includeDemo ?? false;
    
    const records = await this.prisma.aiReadingRecord.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' }
    });

    if (includeDemo) {
      return records;
    }

    // Exclui registos marcados como "demo_data"
    return records.filter(r => {
      const flags = r.safetyFlagsJson as string[] | undefined;
      return !flags || !Array.isArray(flags) || !flags.includes("demo_data");
    });
  }

  private buildAiReadingInputFromAnalysis(analysis: any, activeMemberId?: string): GenerateInsightsDto {
    return {
      analysisId: analysis.id,
      selectedDate: analysis.analysisDate.toISOString(),
      isDemo: false,
      measurements: analysis.measurements.map(m => ({
        id: m.id,
        code: m.code,
        value: m.value,
        unit: m.unit,
        category: m.category,
        flags: m.flags,
      })),
      events: analysis.events.map(e => ({
        id: e.id,
        code: e.code,
        type: e.type,
        data: e.data,
      })),
      ecosystemFacts: analysis.events.map(e => ({
        id: e.id,
        code: e.code,
        type: e.type,
        data: e.data,
      }))
    };
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

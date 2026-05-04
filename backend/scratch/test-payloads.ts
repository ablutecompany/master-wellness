import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const insightsSchemaV2 = {
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

async function testPayload(name: string, payload: any) {
  console.log(`\n========================================`);
  console.log(`TESTANDO PAYLOAD: ${name}`);
  console.log(`========================================`);

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
    JSON.stringify(payload, null, 2),
  ].join('\n');

  try {
    const response: any = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'InsightsV2',
          strict: true,
          schema: insightsSchemaV2,
        },
      },
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    console.log(`\n-> Foco Principal: ${parsed.summary.focusDimensionId} (${parsed.summary.focusReason})`);
    console.log(`-> Frase da Síntese: "${parsed.summary.body.substring(0, 100)}..."`);
    
    // Pick dimension specific to the test
    let testDim = parsed.dimensions[0];
    if (name === 'B_URINA') testDim = parsed.dimensions.find((d: any) => d.id === 'internal_balance') || parsed.dimensions[0];
    if (name === 'C_CARGA') testDim = parsed.dimensions.find((d: any) => d.id === 'physiological_load') || parsed.dimensions[0];

    console.log(`\n-> Dimensão de Teste: ${testDim.label} (${testDim.stateLabel} - Score: ${testDim.score})`);
    console.log(`   - Referência 1: ${testDim.references[0]}`);
    console.log(`   - Referência 2: ${testDim.references[1]}`);
    console.log(`   - Ação 1: ${testDim.actions[0]}`);
    console.log(`   - Ação 2: ${testDim.actions[1]}`);
    
  } catch (err: any) {
    console.error(`ERROR: ${err.message}`);
  }
}

// === PAYLOAD A: EQUILIBRADO ===
const payloadA = {
  sourceOrigin: "real", isDemo: false, analysisDate: new Date().toISOString(),
  sourcePolicy: { urine: "used", feces: "used", physiological: "used", context: "used", miniapps: "used" },
  dimensions: [
    { id: "energy", label: "Energia", type: "momentary", score: 85, state: "stable", stateLabel: "Estável", confidence: "high", drivers: [{ label: "Sono (horas)", value: 8, direction: "positive", impact: "high" }] },
    { id: "recovery", label: "Recuperação", type: "momentary", score: 88, state: "stable", stateLabel: "Estável", confidence: "high", drivers: [{ label: "Frequência Cardíaca", value: 60, direction: "positive", impact: "high" }] },
    { id: "internal_balance", label: "Equilíbrio interno", type: "functional", score: 90, state: "stable", stateLabel: "Estável", confidence: "high", drivers: [{ label: "Densidade Urinária", value: 1.015, direction: "positive", impact: "high" }] },
    { id: "metabolic_rhythm", label: "Ritmo metabólico", type: "functional", score: 85, state: "stable", stateLabel: "Estável", confidence: "high", drivers: [] },
    { id: "intestinal_state", label: "Estado intestinal", type: "momentary", score: 80, state: "stable", stateLabel: "Estável", confidence: "high", drivers: [] },
    { id: "food_adjustments", label: "Ajustes alimentares", type: "momentary", score: 85, state: "stable", stateLabel: "Estável", confidence: "high", drivers: [] },
    { id: "physiological_load", label: "Carga fisiológica", type: "momentary", score: 90, state: "stable", stateLabel: "Estável", confidence: "high", drivers: [] },
    { id: "vitality", label: "Vitalidade", type: "longitudinal", score: 85, state: "stable", stateLabel: "Estável", confidence: "medium", drivers: [] }
  ],
  history: { available: true, readingsCount: 5, baselineAvailable: true, limitations: [] }
};

// === PAYLOAD B: CONCENTRAÇÃO URINÁRIA ===
const payloadB = {
  sourceOrigin: "real", isDemo: false, analysisDate: new Date().toISOString(),
  sourcePolicy: { urine: "used", feces: "missing", physiological: "used", context: "used", miniapps: "used" },
  dimensions: [
    { id: "energy", label: "Energia", type: "momentary", score: 75, state: "watch", stateLabel: "Atenção", confidence: "high", drivers: [] },
    { id: "recovery", label: "Recuperação", type: "momentary", score: 80, state: "stable", stateLabel: "Estável", confidence: "high", drivers: [] },
    { id: "internal_balance", label: "Equilíbrio interno", type: "functional", score: 55, state: "watch", stateLabel: "Atenção", confidence: "high", drivers: [{ label: "Densidade Urinária", value: 1.030, direction: "negative", impact: "high" }, { label: "Rácio Na/K", value: 3.8, direction: "negative", impact: "medium" }] },
    { id: "metabolic_rhythm", label: "Ritmo metabólico", type: "functional", score: 78, state: "watch", stateLabel: "Atenção", confidence: "high", drivers: [] },
    { id: "intestinal_state", label: "Estado intestinal", type: "momentary", score: null, state: "insufficient", stateLabel: "Insuficiente", confidence: "insufficient", drivers: [] },
    { id: "food_adjustments", label: "Ajustes alimentares", type: "momentary", score: 60, state: "watch", stateLabel: "Atenção", confidence: "high", drivers: [{ label: "Rácio Na/K", value: 3.8, direction: "negative", impact: "high" }] },
    { id: "physiological_load", label: "Carga fisiológica", type: "momentary", score: 85, state: "stable", stateLabel: "Estável", confidence: "high", drivers: [] },
    { id: "vitality", label: "Vitalidade", type: "longitudinal", score: 70, state: "watch", stateLabel: "Atenção", confidence: "medium", drivers: [] }
  ],
  history: { available: true, readingsCount: 5, baselineAvailable: true, limitations: [] }
};

// === PAYLOAD C: CARGA FISIOLÓGICA ===
const payloadC = {
  sourceOrigin: "real", isDemo: false, analysisDate: new Date().toISOString(),
  sourcePolicy: { urine: "missing", feces: "missing", physiological: "used", context: "used", miniapps: "used" },
  dimensions: [
    { id: "energy", label: "Energia", type: "momentary", score: 45, state: "priority", stateLabel: "Prioritário", confidence: "high", drivers: [] },
    { id: "recovery", label: "Recuperação", type: "momentary", score: 35, state: "priority", stateLabel: "Prioritário", confidence: "high", drivers: [{ label: "Sono (horas)", value: 4, direction: "negative", impact: "high" }, { label: "Temperatura", value: 37.8, direction: "negative", impact: "high" }] },
    { id: "internal_balance", label: "Equilíbrio interno", type: "functional", score: null, state: "insufficient", stateLabel: "Insuficiente", confidence: "insufficient", drivers: [] },
    { id: "metabolic_rhythm", label: "Ritmo metabólico", type: "functional", score: 50, state: "watch", stateLabel: "Atenção", confidence: "high", drivers: [] },
    { id: "intestinal_state", label: "Estado intestinal", type: "momentary", score: null, state: "insufficient", stateLabel: "Insuficiente", confidence: "insufficient", drivers: [] },
    { id: "food_adjustments", label: "Ajustes alimentares", type: "momentary", score: null, state: "insufficient", stateLabel: "Insuficiente", confidence: "insufficient", drivers: [] },
    { id: "physiological_load", label: "Carga fisiológica", type: "momentary", score: 40, state: "priority", stateLabel: "Prioritário", confidence: "high", drivers: [{ label: "Frequência Cardíaca", value: 95, direction: "negative", impact: "high" }, { label: "HRV", value: 20, direction: "negative", impact: "high" }] },
    { id: "vitality", label: "Vitalidade", type: "longitudinal", score: 65, state: "watch", stateLabel: "Atenção", confidence: "medium", drivers: [] }
  ],
  history: { available: true, readingsCount: 5, baselineAvailable: true, limitations: [] }
};

async function run() {
  await testPayload('A_EQUILIBRADO', payloadA);
  await testPayload('B_URINA', payloadB);
  await testPayload('C_CARGA', payloadC);
}

run();

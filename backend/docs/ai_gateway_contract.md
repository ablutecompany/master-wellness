# AI Gateway — Contrato Técnico

## Rota

```
POST /ai-gateway/generate-insights
```

Sem global prefix. Sem guards. Sem auth. Sem rate limiting.

## Servidor

- Framework: NestJS
- Porta: `process.env.PORT` ou `3000`
- Módulo: `AiGatewayModule` registado em `AppModule`

---

## Provider

- **SDK:** `openai` (npm)
- **API usada:** Responses API (`this.openai.responses.create`)
- **NÃO é** Chat Completions (`chat.completions.create`)
- **Modelo hardcoded no service:** `gpt-5.4-mini`
- **Modelo no .env:** `OPENAI_MODEL=gpt-5` (ignorado — o service não lê esta variável)
- **API Key:** lida via `ConfigService.get('OPENAI_API_KEY')`

---

## Request Shape (DTO)

Ficheiro: `dto/generate-insights.dto.ts`

```typescript
{
  analysisId: string;
  selectedDate: string;
  measurements: any[];
  events: any[];
  ecosystemFacts: any[];
  isDemo: boolean;
  demoScenarioKey?: string;
}
```

- Sem validação (`class-validator` não usado)
- Sem `class-transformer`
- Sem `ValidationPipe` no controller
- Todos os arrays aceitam qualquer shape

---

## OpenAI Request (interno)

O service constrói:

```typescript
this.openai.responses.create({
  model: 'gpt-5.4-mini',
  input: prompt,         // string com JSON.stringify do payload inteiro
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'Insights',
      strict: true,
      schema: insightsSchema
    }
  }
})
```

### JSON Schema forçado

```json
{
  "headline": "string",
  "summary": "string",
  "domains": {
    "energia_disponibilidade": "string",
    "recuperacao_resiliencia": "string",
    "digestao_trato_intestinal": "string",
    "ritmo_renovacao": "string"
  },
  "suggestions": ["string"]
}
```

- `additionalProperties: false`
- `strict: true`

---

## Response Shape (sucesso)

```json
{
  "status": "success",
  "payload": <response.data>
}
```

- `response.data` é o JSON parseado pelo SDK da Responses API
- Não há tratamento de `response.output` ou `response.output_text`
- Um `console.dir(response, { depth: null })` é feito em cada chamada

---

## Response Shape (erro)

HTTP 500 com body:

```json
{
  "statusCode": 500,
  "message": "Falha ao gerar insights: <mensagem do erro original>"
}
```

- Todos os erros são convertidos em `InternalServerErrorException`
- Sem distinção entre 401 (API key inválida), 429 (rate limit), 400 (schema inválido)
- Sem retry
- Sem timeout explícito

---

## Ficheiro types.ts

Define interfaces `PromptInput`, `PromptResult`, `PromptDefinition` — **nenhuma é usada** no service ou controller actuais. São código morto/preparatório.

---

## Ficheiro test-openai.ts

Script standalone que:
- Instancia `AiGatewayService` directamente com `PrismaService` e `ConfigService`
- Chama `service.testOpenAI()` — **método que não existe no service actual**
- Script inoperacional — vai crashar em runtime

---

## Relação com o Frontend

- O frontend (`src/`) **não chama** esta rota
- Não existe nenhum `fetch` ou cliente HTTP configurado para `/ai-gateway/generate-insights`
- A leitura AI actual é calculada localmente via `src/services/semantic-output/analysis-engine.ts`
- O `analysis-engine.ts` usa `AnalysisMeasurement.type` e `AnalysisMeasurement.marker` (nomes do store, não do schema Supabase)

---

## Gaps Técnicos

| # | Gap | Severidade |
|---|-----|-----------|
| 1 | Modelo `gpt-5.4-mini` hardcoded — ignora `OPENAI_MODEL` do .env | Média |
| 2 | Usa Responses API com `response.data` — campo pode não existir; a Responses API retorna `output_text` | Alta |
| 3 | `@ts-ignore` no SDK call — tipagens não verificadas | Média |
| 4 | Sem validação do DTO (sem `class-validator`) | Média |
| 5 | Sem auth/guards — qualquer request anónimo pode chamar a rota | Alta |
| 6 | Sem retry / timeout / circuit breaker | Média |
| 7 | Sem distinção de erros (401 vs 429 vs 500) | Média |
| 8 | `console.dir` em produção — log não estruturado | Baixa |
| 9 | `test-openai.ts` chama método inexistente `testOpenAI()` | Baixa (script morto) |
| 10 | `types.ts` define interfaces não usadas | Baixa (código morto) |
| 11 | Frontend não consome esta rota — integração inexistente | Alta |
| 12 | Domains no schema OpenAI (energia_disponibilidade, etc.) divergem dos domains do analysis-engine local (sleep, nutrition, general, energy, recovery, performance) | Alta |
| 13 | DTO usa `ecosystemFacts` mas o schema Supabase usa `analysis_events` com `event_type` / `occurred_at` | Média |

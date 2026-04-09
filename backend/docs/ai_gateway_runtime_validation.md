# AI Gateway — Runtime Validation

## Arranque

```bash
cd backend
npm run start:dev
```

**Esperado:** `Nest application successfully started` sem crashes.
Se falhar com `OPENAI_API_KEY não está definida` → verificar `.env`.

---

## Teste 1 — Payload inválido (validação do DTO)

```bash
curl -s -X POST http://localhost:3000/ai-gateway/generate-insights \
  -H "Content-Type: application/json" \
  -d '{"analysisId": "test"}'
```

**Esperado:** HTTP 400 com mensagens de validação class-validator:
```json
{
  "statusCode": 400,
  "message": ["selectedDate must be a string", "measurements must be an array", ...],
  "error": "Bad Request"
}
```

**O que valida:** DTO com class-validator está activo.

---

## Teste 2 — Campo extra rejeitado

```bash
curl -s -X POST http://localhost:3000/ai-gateway/generate-insights \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "t1",
    "selectedDate": "2026-04-09",
    "measurements": [],
    "events": [],
    "ecosystemFacts": [],
    "isDemo": false,
    "campoInvalido": "abc"
  }'
```

**Esperado:** HTTP 400 com `property campoInvalido should not exist`.

**O que valida:** `forbidNonWhitelisted: true` activo.

---

## Teste 3 — Request mínimo válido

```bash
curl -s -X POST http://localhost:3000/ai-gateway/generate-insights \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "test-001",
    "selectedDate": "2026-04-09",
    "measurements": [
      {"type": "urinalysis", "marker": "pH", "value": "6.5", "unit": "pH"}
    ],
    "events": [],
    "ecosystemFacts": [],
    "isDemo": false
  }'
```

**Esperado (sucesso):**
```json
{
  "ok": true,
  "provider": "openai",
  "model": "...",
  "insight": {
    "headline": "...",
    "summary": "...",
    "domains": {
      "energia_disponibilidade": "...",
      "recuperacao_resiliencia": "...",
      "digestao_trato_intestinal": "...",
      "ritmo_renovacao": "..."
    },
    "suggestions": ["..."]
  },
  "meta": {
    "execMillis": ...,
    "tokensUsed": ...,
    "inputTokens": ...,
    "outputTokens": ...,
    "finishReason": "...",
    "parsingSource": "output_text"
  }
}
```

### Sinais concretos de parsing correcto
1. `ok` é `true`
2. `insight` é objecto (não string, não undefined, não null)
3. `insight.headline` é string não-vazia
4. `insight.domains` tem exactamente 4 chaves
5. `insight.suggestions` é array
6. `meta.execMillis` é número positivo

### Sinais concretos de que o bug response.data ficou resolvido
- Se o output contém `"ok": true` e `"insight"` com dados reais → **resolvido**
- Se o output contém `"insight": null` ou `"insight": undefined` → **NÃO resolvido** (ainda a ler response.data)
- Para confirmar, verificar logs do backend: deve aparecer mensagem `Insight gerado em Xms` e NÃO `output_text ausente`

---

## Teste 4 — Request demo completo

```bash
curl -s -X POST http://localhost:3000/ai-gateway/generate-insights \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "demo-001",
    "selectedDate": "2026-04-09",
    "measurements": [
      {"type": "urinalysis", "marker": "pH Urinário", "value": "6.5", "unit": "pH"},
      {"type": "urinalysis", "marker": "Gravidade Específica", "value": "1.015", "unit": "g/mL"},
      {"type": "urinalysis", "marker": "Proteínas", "value": "negativo", "unit": "mg/dL"},
      {"type": "urinalysis", "marker": "Glicose", "value": "negativo", "unit": "mg/dL"},
      {"type": "ecg", "marker": "Ritmo Cardíaco", "value": "68", "unit": "bpm"},
      {"type": "ppg", "marker": "SpO2", "value": "98", "unit": "%"},
      {"type": "temp", "marker": "Temperatura", "value": "36.4", "unit": "°C"},
      {"type": "fecal", "marker": "Bristol", "value": "Tipo 4", "unit": ""}
    ],
    "events": [
      {"type": "sleep_duration_logged", "value": "7h 12m", "sourceAppId": "apple_health"}
    ],
    "ecosystemFacts": [],
    "isDemo": true,
    "demoScenarioKey": "healthy_baseline"
  }'
```

**Esperado:** mesma shape do Teste 3 com conteúdo mais rico.

---

## Teste 5 — Erro de API key

1. Alterar `OPENAI_API_KEY` no `.env` para `sk-invalida`
2. Reiniciar backend
3. Repetir curl do Teste 3

**Esperado:**
```json
{
  "ok": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "...",
    "details": {
      "execMillis": ...,
      "model": "..."
    }
  }
}
```

4. Restaurar API key correcta e reiniciar.

---

## Teste 6 — Verificação de fonte de parsing

Após um Teste 3 ou 4 bem-sucedido, verificar os logs do backend (stdout):

**Cenário A: Sucesso via conveniência**
Logs devem mostrar:
`[AiGatewayService] Insight gerado [source=output_text] em ...`

**Cenário B: Sucesso via fallback (Resiliência Operacional)**
Se `output_text` vier vazio do SDK (mas os dados existirem no array `output` do provider), os logs devem mostrar:
`[AiGatewayService] output_text vazio, a tentar extrair do array output...`
`[AiGatewayService] Insight gerado [source=output_array] em ...`

**O que isto prova:** O contrato técnico está endurecido contra variações de estrutura da Responses API / SDK.

---

## Checklist final

- [x] Backend arranca (`npm run build` OK)
- [x] Teste 1 — validação 400 Bad Request
- [x] Teste 2 — forbidNonWhitelisted OK
- [x] Teste 3 — **Ok: true** com insight real
- [x] Teste 5 — **Ok: false** com code: AUTH_FAILED
- [x] Teste 6 — Logs confirmam a origem do parsing (`source=...`)
- [x] Discrepância `response.data` eliminada
- [x] Documentado gap de Auth como limitação frontal

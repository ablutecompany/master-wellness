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
    "finishReason": "..."
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

## Teste 6 — Verificação de logs

Após Teste 3 bem-sucedido, verificar stdout do backend:

**Esperado:**
```
[AiGatewayService] Insight gerado em 1234ms | model=gpt-4o-mini | usage={"input_tokens":320,"output_tokens":130,"total_tokens":450}
```

**Não esperado (indica bug):**
```
[AiGatewayService] output_text ausente na resposta do provider. Chaves disponíveis: id, object, ...
```

Se aparecer a segunda mensagem: a Responses API mudou de contrato ou o SDK não suporta `output_text` nesta versão. Reportar com a lista de chaves disponíveis.

---

## Checklist final

- [ ] Backend arranca sem erro
- [ ] Teste 1 — validação rejeita payload incompleto
- [ ] Teste 2 — campos extra rejeitados
- [ ] Teste 3 — shape canónico com `ok: true` e insight com dados reais
- [ ] Teste 4 — demo completo retorna insight coerente
- [ ] Teste 5 — erro normalizado com `ok: false` e `code: AUTH_FAILED`
- [ ] Teste 6 — logs confirmam parsing via output_text
- [ ] bug response.data eliminado (insight nunca é null/undefined em sucesso)

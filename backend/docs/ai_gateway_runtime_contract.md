# AI Gateway — Runtime Contract v1.0

## Rota

```
POST /ai-gateway/generate-insights
```

- Sem global prefix
- Sem auth (provisório — a documentar como gap)
- Input validado via `ValidationPipe` com `whitelist: true`

---

## Provider

- **SDK:** `openai` npm (>=6.x)
- **API:** Responses API (`openai.responses.create`)
- **Modelo:** lido de `OPENAI_MODEL` no `.env` (fallback: `gpt-4o-mini`)
- **Output format:** `json_schema` com `strict: true`

---

## Request canónico

```json
{
  "analysisId": "string (obrigatório)",
  "selectedDate": "string (obrigatório)",
  "measurements": "any[] (obrigatório)",
  "events": "any[] (obrigatório)",
  "ecosystemFacts": "any[] (obrigatório)",
  "isDemo": "boolean (obrigatório)",
  "demoScenarioKey": "string (opcional)"
}
```

Campos extra são rejeitados (`forbidNonWhitelisted: true`).

---

## Response canónico — sucesso

HTTP 200 sempre (sucesso e erro normalizado).

```json
{
  "ok": true,
  "provider": "openai",
  "model": "gpt-4o-mini",
  "insight": {
    "headline": "string",
    "summary": "string",
    "domains": {
      "energia_disponibilidade": "string",
      "recuperacao_resiliencia": "string",
      "digestao_trato_intestinal": "string",
      "ritmo_renovacao": "string"
    },
    "suggestions": ["string"]
  },
  "meta": {
    "execMillis": 1234,
    "tokensUsed": 450,
    "inputTokens": 320,
    "outputTokens": 130,
    "finishReason": "completed"
  }
}
```

### Campos obrigatórios no insight
- `headline` (string)
- `summary` (string)
- `domains` (object com 4 chaves fixas)
- `suggestions` (array de strings)

### Campos do meta
- `execMillis` (integer, sempre presente)
- `tokensUsed` (integer ou null)
- `inputTokens` (integer ou null)
- `outputTokens` (integer ou null)
- `finishReason` (string ou null)

---

## Response canónico — erro

```json
{
  "ok": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Incorrect API key provided",
    "details": {
      "execMillis": 45,
      "model": "gpt-4o-mini"
    }
  }
}
```

### Códigos de erro possíveis

| Código | Significado |
|--------|-----------|
| `AUTH_FAILED` | API key inválida ou ausente |
| `RATE_LIMITED` | Rate limit do provider atingido |
| `INVALID_REQUEST` | Request rejeitado pelo provider (schema, payload) |
| `MODEL_NOT_FOUND` | Modelo não existe ou indisponível |
| `PROVIDER_UNREACHABLE` | Timeout ou falha de rede ao provider |
| `PARSE_FAILED` | output_text ausente ou não é JSON válido |
| `SCHEMA_MISMATCH` | JSON parseado mas campos obrigatórios em falta |
| `PROVIDER_ERROR` | Erro genérico do provider não classificado |
| `INTERNAL_ERROR` | Erro interno do backend não classificado |

### Campos do error
- `code` (string, sempre presente)
- `message` (string, sempre presente)
- `details` (object, opcional — contém `execMillis` e `model` quando disponível)

---

## Parsing do provider

O service lê **exclusivamente** `response.output_text` (Responses API).

- `response.data` → **NÃO é usado** (não existe na Responses API)
- `response.output_text` → string JSON, parseada com `JSON.parse()`
- Validação pós-parse dos 4 campos obrigatórios
- Se `output_text` for `undefined` → erro `PARSE_FAILED`
- Se `JSON.parse` falhar → erro `PARSE_FAILED`
- Se campos em falta → erro `SCHEMA_MISMATCH`

---

## Limitações actuais

| # | Limitação | Impacto |
|---|-----------|---------|
| 1 | Sem auth — rota aberta | Qualquer request anónimo pode chamar |
| 2 | Sem retry | Uma falha transitória não é re-tentada |
| 3 | Sem timeout explícito | Depende do timeout default do SDK |
| 4 | Sem rate limiting próprio | Depende apenas do rate limit do provider |
| 5 | DTO aceita `any[]` em measurements/events | Sem validação de shape interno dos arrays |
| 6 | Domains OpenAI divergem do analysis-engine local | Integração frontend requer mapeamento |

---

## Dependências

- `OPENAI_API_KEY` (obrigatória, `.env`)
- `OPENAI_MODEL` (opcional, `.env`, fallback `gpt-4o-mini`)
- `openai` npm >=6.x
- `class-validator` + `class-transformer` (NestJS)

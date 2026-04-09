# AI Gateway — Runtime Contract v1.0

## Rota

```
POST /ai-gateway/generate-insights
```

- Sem global prefix
- **Sem Auth (Limitação Actual / Gap Conhecido):** A rota está aberta e não exige autenticação nesta milestone. Esta é uma decisão de desenvolvimento para facilitar a integração inicial.
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
  "analysisId": "string (obrigatório, não vazio)",
  "selectedDate": "string (obrigatório, não vazio)",
  "measurements": "any[] (obrigatório)",
  "events": "any[] (obrigatório)",
  "ecosystemFacts": "any[] (opcional)",
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
    "finishReason": "completed",
    "parsingSource": "output_text | output_array"
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

## Parsing do provider (Estratégia Defensiva)

O service utiliza uma estratégia de duas camadas:

1. **Primário:** Lê `response.output_text` (propriedade de conveniência do SDK).
2. **Fallback Defensivo:** Se o primário for vazio, extrai manualmente o texto percorrendo o array `response.output[*].content[*]` onde `type: "output_text"`.

Esta abordagem resolve a fragilidade de leitura caso a estrutura de resposta varie ou o SDK mude o seu comportamento de conveniência.

---

## Limitações actuais

| # | Limitação | Impacto |
|---|-----------|---------|
| 1 | **Sem Auth** | **Gap Prioritário.** Qualquer cliente pode chamar o endpoint livremente. |
| 2 | Sem retry automático | Falhas de rede temporárias resultam em erro imediato. |
| 3 | Sem rate limiting local | O stress-test pode ser travado apenas pelos limites do provider. |
| 4 | Validação rasa de arrays | O DTO garante a presença de `measurements` mas não valida o schema interno de cada item. |

---

## Dependências

- `OPENAI_API_KEY` (obrigatória, `.env`)
- `OPENAI_MODEL` (opcional, `.env`, fallback `gpt-4o-mini`)
- `openai` npm >=6.x
- `class-validator` + `class-transformer` (NestJS)

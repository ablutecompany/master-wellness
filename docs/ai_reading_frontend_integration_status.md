# AI Reading — Frontend Integration Status

## Ficheiros Alterados/Criados

| Ficheiro | Ação |
|---|---|
| `src/services/ai-gateway/client.ts` | **[NEW]** Adapter frontend para `POST /ai-gateway/generate-insights` |
| `src/services/semantic-output/index.ts` | **[MODIFIED]** `loadAnalysis()` agora dispara pedido async ao backend |

## Como `activeAnalysis` É Transformada em Request

```
activeAnalysis (useMemo) → loadAnalysis(analysis) → buildRequestFromAnalysis(analysis)
```

O adapter `client.ts` transforma a `Analysis` no DTO esperado pelo backend:

```typescript
{
  analysisId:       analysis.id,
  selectedDate:     analysis.analysisDate,
  measurements:     analysis.measurements,
  events:           analysis.ecosystemFacts,
  ecosystemFacts:   analysis.ecosystemFacts,
  isDemo:           analysis.source === 'demo',
  demoScenarioKey:  analysis.demoScenarioKey ?? undefined,
}
```

## Serviço/Adapter

`src/services/ai-gateway/client.ts` — exports:
- `generateInsights(analysis)` — chamada HTTP ao backend, com race protection
- `cancelPendingInsights()` — invalida pedido em voo (chamado quando activeAnalysis muda)

## Shape de Response Consumido

**Sucesso:**
```json
{
  "ok": true,
  "provider": "openai",
  "model": "gpt-4o-mini",
  "insight": {
    "headline": "...",
    "summary": "...",
    "domains": {
      "energia_disponibilidade": "...",
      "recuperacao_resiliencia": "...",
      "digestao_trato_intestinal": "...",
      "ritmo_renovacao": "..."
    },
    "suggestions": ["...", "..."]
  },
  "meta": { "execMillis": 1234, "tokensUsed": 500 }
}
```

**Erro:**
```json
{
  "ok": false,
  "error": { "code": "AUTH_FAILED", "message": "..." }
}
```

## Fluxo Loading / Error / Success

1. `activeAnalysis` muda → `useEffect` chama `loadAnalysis(analysis)`
2. `loadAnalysis`:
   - **Imediato:** computa bundle LOCAL via `computeSemanticFromMeasurements()` → store atualizado → UI renderiza instantaneamente
   - **Async:** dispara `generateInsights(analysis)` ao backend
3. Se backend responde com sucesso:
   - `aiInsight` e `aiMeta` injetados no store
   - Subscribers notificados → UI pode renderizar insights AI
4. Se backend falha:
   - `console.warn` apenas
   - Bundle local mantido — sem regressão, sem crash
5. Se `activeAnalysis` muda antes da resposta chegar:
   - `cancelPendingInsights()` invalida o pedido anterior
   - Resposta antiga descartada silenciosamente

## Comportamento ao Trocar de Análise

- `cancelPendingInsights()` chamado antes de qualquer computação
- Incrementa `activeRequestId` — qualquer fetch em voo é ignorado ao retornar
- Zero race conditions: resposta antiga nunca sobrescreve dados da nova análise

## Comportamento em Demo

- Demo usa a mesma `activeAnalysis` (source: `'demo'`)
- O request ao backend inclui `isDemo: true` e `demoScenarioKey`
- O backend processa normalmente (ou pode tratar demo de forma especial)
- O fallback local funciona igualmente em demo e em modo real

## Pendente

- **UI de aiInsight:** O `aiInsight` é injetado no store, mas a UI da Leitura AI ainda renderiza `semanticThemes` (do bundle local). Falta criar componente/secção na Leitura AI que renderize o `aiInsight` quando disponível.
- **URL do backend em produção:** Actualmente hardcoded a `localhost:3001`. Necessita variável de ambiente para produção.
- **Auth:** Endpoint sem autenticação (provisório).
- **Retry:** Não há retry automático no frontend — o backend já faz retry internamente.

## Critérios de Aceitação

| # | Critério | Estado |
|---|---|---|
| 1 | Leitura AI usa `activeAnalysis` | ✅ |
| 2 | Mudar no Histórico muda Leitura AI | ✅ |
| 3 | Demo usa mesma cadeia | ✅ |
| 4 | Frontend não consome shape cru do provider | ✅ |
| 5 | Não mostra insights desfasados | ✅ (race protection) |
| 6 | Sem fontes paralelas | ✅ |
| 7 | UI renderiza `aiInsight` do backend | ⏳ Pendente |

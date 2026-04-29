# AI Reading — Ativação Controlada OpenAI (R3C)

## Feature Flag

**Nome:** `EXPO_PUBLIC_ENABLE_OPENAI_READING`  
**Default:** `false` (OFF)  
**Localização:** `.env.local` ou variáveis de ambiente do deploy  

Para ativar:
```
EXPO_PUBLIC_ENABLE_OPENAI_READING=true
```

## Fluxo de Execução

```
AIReadingScreen monta
  │
  ├──→ Motor local calcula AIReading (sempre, imediato)
  │     └──→ UI renderiza leitura local
  │
  ├── Flag OFF? → Fim. Leitura local exibida.
  │
  └── Flag ON?
        │
        ├──→ Badge "A refinar leitura…" aparece
        ├──→ generateInsights(analysis) → backend → OpenAI
        │
        ├── Sucesso?
        │     └──→ normalizeAIReadingResponse(raw)
        │           └──→ UI atualiza para leitura OpenAI
        │                 └──→ readingSource = 'openai'
        │
        └── Falha? (timeout / erro / schema / rede)
              └──→ Mantém leitura local
                    └──→ readingSource = 'fallback'
```

## Proteções Anti-Loop

- `useEffect` depende apenas de `analysisKey` (= `lastAnalysis.id`) e `isDemoMode`
- `analysisKey` é estável: só muda quando a análise ativa muda
- `cancelPendingInsights()` invalida qualquer request anterior antes de lançar novo
- Flag `cancelled` no cleanup do useEffect previne state updates em componentes desmontados
- Fetch com `AbortController` e timeout de 15 segundos

## Fallback Local

O fallback é acionado em qualquer um destes cenários:
- Feature flag OFF
- Backend indisponível / rede falha
- Timeout (>15s)
- Resposta com `ok: false`
- JSON inválido no normalize
- Schema incompleto
- Erro inesperado

Comportamento: a UI mantém a leitura local intacta, sem crash nem erro visível.

## Indicação da Origem

Na secção "Referências & fundamentação":
- **Motor:** `Motor local` | `Assistido por IA` | `Fallback local aplicado`

No footer técnico (discreto, opacidade 0.3):
- `AI READING R3 • CONTRACT v2.0 • LOCAL|OPENAI|FALLBACK • REAL|SIMULAÇÃO`

## Privacidade

Dados enviados ao backend (que depois envia à OpenAI):
- `analysisId`
- `selectedDate`
- `measurements` (biomarcadores da análise ativa)
- `ecosystemFacts` (factos contextuais da análise ativa)
- `isDemo` + `demoScenarioKey`

**Não são enviados:**
- Nome / email / PII do utilizador
- Dados de outros membros do agregado
- Histórico completo de análises
- Token de sessão / credenciais
- Dados fora da análise ativa

## DEMO

- Flag OFF: DEMO usa motor local (comportamento inalterado)
- Flag ON: DEMO pode chamar OpenAI com `isDemo: true`, mas com fallback local
- DEMO OFF limpa estado como antes (sem resíduos)

## Observabilidade (apenas __DEV__)

| Log | Quando |
|---|---|
| `AI_READING_OPENAI_SKIPPED_FLAG_OFF` | Flag OFF, nenhum pedido feito |
| `AI_READING_OPENAI_REQUEST` | Pedido enviado ao backend |
| `AI_READING_OPENAI_SUCCESS` | Resposta válida recebida e normalizada |
| `AI_READING_OPENAI_FALLBACK` | Qualquer falha, fallback local ativado |

Estes logs **não** aparecem em produção (protegidos por `__DEV__`).

## Ficheiros Envolvidos

| Ficheiro | Papel |
|---|---|
| `src/screens/AIReadingScreen.tsx` | Orquestra flag, motor local, chamada OpenAI, fallback, UI |
| `src/services/ai-gateway/client.ts` | Client HTTP para backend (com timeout e race protection) |
| `src/services/semantic-output/ai-reading-adapter.ts` | Normaliza JSON bruto do backend em AIReading |
| `src/services/semantic-output/ai-reading-engine.ts` | Motor local (nunca removido) |
| `backend/src/ai-gateway/ai-gateway.service.ts` | Serviço backend que chama OpenAI |

## Como Testar

### Flag OFF (default)
1. Não definir `EXPO_PUBLIC_ENABLE_OPENAI_READING` ou definir como `false`
2. Abrir Leitura AI
3. Confirmar que usa motor local
4. Confirmar que não há pedidos de rede ao backend de AI
5. Console deve mostrar `AI_READING_OPENAI_SKIPPED_FLAG_OFF`

### Flag ON com backend disponível
1. Definir `EXPO_PUBLIC_ENABLE_OPENAI_READING=true` no `.env.local`
2. Ter backend a correr localmente (`npm run start:dev` no backend)
3. Abrir Leitura AI
4. Badge "A refinar leitura…" deve aparecer brevemente
5. Leitura deve atualizar para versão OpenAI
6. Referências devem mostrar "Assistido por IA"

### Flag ON com backend indisponível
1. Definir flag como `true` mas não ter backend a correr
2. Abrir Leitura AI
3. Leitura local deve aparecer normalmente
4. Após timeout, readingSource deve ser `fallback`
5. Sem crash, sem erro visível

## Próximos Passos

1. Ativar flag em staging para testes internos
2. Comparar qualidade da leitura OpenAI vs local
3. Implementar cache por `analysisId` (evitar custos repetidos)
4. Adicionar botão de refresh manual (opcional)
5. Ativar em produção quando validada

# Active Analysis — Frontend Source of Truth

## Source of Truth

```
activeAnalysis = useMemo(() => {
  if (demoAnalysis) return demoAnalysis;
  if (activeAnalysisId) return analyses.find(...);
  return analyses[0] ?? null;
}, [demoAnalysis, activeAnalysisId, analyses]);
```

**Ficheiro:** `src/screens/HomeScreen.tsx` (linhas 169-178)

Todos os módulos leem **exclusivamente** de `activeAnalysis`. Não existem fontes paralelas.

---

## Ficheiros Envolvidos

| Ficheiro | Papel |
|---|---|
| `src/screens/HomeScreen.tsx` | Define `activeAnalysis`, gere `demoAnalysis`, `activeAnalysisId`, orquestra painéis |
| `src/components/HistoricoModal.tsx` | Seletor temporal — chama `onSelectAnalysis(id)` que muda `activeAnalysisId` no store |
| `src/store/types.ts` | Define `Analysis`, `AppState.activeAnalysisId`, `AppState.analyses` |
| `src/services/semantic-output/demo-scenarios.ts` | Cria objetos `Analysis` temporários para Demo |
| `src/services/semantic-output/` | `semanticOutputService.loadAnalysis(activeAnalysis)` — bundle semântico derivado da análise ativa |

---

## Como Funciona — Modo Real

1. Store contém `analyses[]` (dados reais do dispositivo/manual)
2. `activeAnalysisId` aponta para a análise selecionada
3. Histórico abre modal → utilizador seleciona análise → `setActiveAnalysisId(id)`
4. `activeAnalysis` (useMemo) recalcula → Resultados e Leitura AI atualizam automaticamente
5. `semanticOutputService.loadAnalysis(activeAnalysis)` dispara recálculo do bundle semântico

## Como Funciona — Modo Demo

1. Utilizador clica "MODO DEMO" em Resultados → seleciona cenário
2. `handleSelectDemo(key)` cria `Analysis` temporária via `createDemoAnalysis(key)` com `source: 'demo'`
3. `setDemoAnalysis(demo)` → `activeAnalysis` (useMemo) prioriza `demoAnalysis` sobre `activeAnalysisId`
4. Resultados e Leitura AI passam a mostrar dados demo — sem contaminar `analyses[]`
5. Badge "MODO DEMO" visível no header da Leitura AI

## Reversão Demo → Real

- "Desativar Demo" no modal MODO DEMO: `handleSelectDemo(null)` → `setDemoAnalysis(null)` → `activeAnalysis` volta a ler de `activeAnalysisId`
- Selecionar análise no Histórico: `setDemoAnalysis(null)` + `setActiveAnalysisId(id)` → limpa demo e muda para análise real
- Fechar Resultados (X): NÃO mata demo — mantém `demoAnalysis` intacta. Demo só é desativado por ação explícita.

---

## Cadeia de Propagação

```
activeAnalysisId (store) ──┐
                           ├──→ activeAnalysis (useMemo) ──→ filteredMeasurements
demoAnalysis (local) ──────┘                              ──→ activeFacts
                                                          ──→ selectedDate
                                                          ──→ factualBioCategories → Resultados
                                                          ──→ semanticOutputService.loadAnalysis() → Leitura AI
```

---

## Critérios de Aceitação

| # | Critério | Estado |
|---|---|---|
| 1 | Existe uma única análise ativa (`activeAnalysis`) | ✅ |
| 2 | Mudar no Histórico muda a análise ativa real | ✅ |
| 3 | Resultados refletem sempre a análise ativa | ✅ |
| 4 | Demo reflete sempre a análise ativa (via `demoAnalysis`) | ✅ |
| 5 | Leitura AI reflete sempre a análise ativa | ✅ |
| 6 | Sair de Demo não deixa lixo ou estado incoerente | ✅ |
| 7 | Demo NÃO contamina `analyses[]` do store | ✅ |
| 8 | Fechar Resultados (X) NÃO desativa Demo | ✅ |

---

## Pendente

- Integração com dados reais via Supabase (substituir seed local)
- Leitura AI com chamada real ao AI-Gateway (backend já fechado, falta ligar frontend)
- Persistência de `activeAnalysisId` entre sessões (atualmente reset no reload)

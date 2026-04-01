# Baseline Técnica: Shell Semântica v1.2.0

**Estado Oficial: FECHADO / CONGELADO**

Este documento estabelece a *Baseline Técnica Operational* para a gestão de estado, governação semântica e adaptadores de Presentation UI da app Ablute Wellness. Qualquer alteração à arquitetura subjacente sem submissão de um novo *ADR* constitui uma regressão.

---

## 1. O Que Está Fechado (Não Reabrir)
- O **Backend Semantic Engine (Deterministico)** dita exclusivamente o processamento de outputs formatados.
- A **Shell Semântica Governance**: Intercetação rigorosa e centralizada da injeção de estados no ciclo de vida da UI.
- O formato unificado do bundle de `SemanticOutputService` (`ready / stale / insufficient_data / error / unavailable`).
- O **DomainPackages** como contrato de contexto para Mini-Apps (substituindo a injeção cega de health summaries).
- O **Insights Adapter** como o *único* local na codebase que traduz os estados determinísticos para *copy* (texto formatado PT-PT) e gere a diferença semântica entre Fallbacks Técnicos e Ausência Biográfica.

---

## 2. Mapa de Single Source of Truth
Para manter a escalabilidade do modelo e evitar redundâncias, é imperativo que cada camada da App aceda **apenas à sua fonte de verdade exclusiva**:

| Domínio de Dados | Single Source of Truth Garantida | Regra de Consumo |
| :--- | :--- | :--- |
| **Narrativa / UI Interpretativa** | `SemanticOutputService` + `Insights Adapter` (`src/services/insights/index.ts`) | **Proibido:** Criar strings ou ecrãs baseados no score bruto. Consumir sempre de `getSemanticInsights()`. |
| **Exames e Registos Físicos** | `Measurement Slice` (`Selectors.selectMeasurements`) | **Acesso:** Exclusivamente factual (lista de registos, timestamps). Sem inferência descritiva. |
| **Contexto Evolutivo** | `Derived Context` (`Selectors.selectActiveDerivedContextFacts`) | **Acesso:** Governação restrita (apenas Mini-Apps que possuam permissão validada acedem à secção correspondente). |
| **Ponte de Mini-Apps** | `DomainPackages` | **Regra:** O contrato principal. Nunca injetar pontuação isolada, usar pacote fechado por controlo de permeabilidade. |

---

## 3. Checklist de Proibições de Regressão
Para evitar a degradação e retorno ao histórico obsoleto de MVP, aplicam-se estas restrições rígidas em qualquer Commit futuro:

- ❌ **Proibido reintroduzir `engines.ts`** (Nem `LanguageEngine`, nem `DecisionEngine`).
- ❌ **Proibido usar `Math.random()` para gerar conteúdo visível, insights ou status.**
- ❌ **Proibido voltar a adicionar chaves legadas `themeScores` ou `globalScore` isoladas como fonte de narrativa.**
- ❌ **Proibido usar `derivedContext` como contrato, estando a sua chave totalmente removida do payload da bridge.**
- ❌ **Proibido testar ou procurar por `derivedContext` com fallbacks (nem sequer expectando `undefined`). Ele não existe.**
- ❌ **Proibido criar bypasses locais na HomeScreen ou ThemesScreen.** O *InsightsAdapter* central processa essa formatação. Se for preciso alterar, altera-se o Adapter.
- ❌ **Proibido contaminar ecrãs factuais (ProfileScreen, AnalysesScreen) com copy semântica.** Os ecrãs factuais só dizem "Peso: 64kg", nunca "Pareces excelente hoje! Peso: 64kg".
- ❌ **Proibido enviar os valores `0` (Zero) ou `[]` (Vazio) para chaves obsoletas.**
- ❌ **Proibido misturar ou colapsar os estados de UI de `error` (Erro de API) e `insufficient_data` (A aguardar medições/peso crítico)** no copy da UI.

---

## 4. Comandos Essenciais de Validação Local
O projeto introduziu uma pipeline robusta contra estas regressões antes do deploy em CI ou committ:

1. **Gatekeeper Anti-Regressão:**  
   Verifica todos os ficheiros via Regex para detetar re-invocações de scripts proibidos *(LanguageEngine, themeScores, etc)*:
   `npm run test:guard`

2. **Suite Standard de Testes (Jest via `jest-expo`):**  
   Garante que os Guard Rails, Interceptors e os adaptadores de Presentation funcionam em isolamento e comportam fallbacks para produção vs throw-fast debugs para ambiente `__DEV__`.
   `npm run test`

*(A ordem recomendada de validação antes de PUSH ao GitHub é a execução isolada do `npm run test:guard`).*

---

## 5. Checklist PR Review (QA Semântico)
Qualquer Code Review tocando em estado ou UI deve validar:

- [ ] A *Nova Feature/Ecrã* usa o Semantic Adapter centralizado em vez de escavar dados na root store?
- [ ] A *Nova Feature/Ecrã* tenta emitir copy/títulos opinativos biográficos por conta própria fugindo ao Governance? (Se Sim = Bloquear).
- [ ] A PR mistura conteúdo Interpretativo nos ecrãs de Analyses ou Profile Factual? (Se Sim = Bloquear).
- [ ] A PR tentou reviver imports antigos (`themesCarousel`, `orbitalCarousel`, `themeScores`) silenciosamente para atalhar funcionalidade? (O `test:guard` detectou?).
- [ ] A PR lida corretamente com a distinção e apresentação condicional dos 4 estados vitais `ready / stale / insufficient_data / error`?
- [ ] O contexto novo injetado na bridge das Mini Apps escapa ao `domainPackages`? (Se Sim = Bloquear).

---

## 6. Fixtures e Contratos Canónicos
O core está agora alinhado aos testes de contrato (*Contract Testing*) para detetar qualquer *Drift* Estrutural antes da UI. As chancelas oficiais em `__fixtures__` provam o comportamento aceite:

- **Semantic Bundle Backend:** `semantic-bundle.ready.json` e `semantic-bundle.partial-stale.json` descrevem a mínima estrutura viável antes de o Adapter gerar o Insight de front-end.
- **Contrato de Bridge Ativo:** O `domainPackages` com as políticas de `allowed`, `unavailable` e `denied`. Estão disponíveis fixtures oficiais (ex: `domain-packages.sleep.allowed.json`) para usar em testes em cada domínio local, suportadas e validadas por helpers de shape em `schema-validators.ts`.

> A Shape runtime ativa despojou e demitiu integralmente a emissão da antiga chave `derivedContext`. É imperativo que novas Apps utilizem 100% o novo SDK de contratos. A injeção e busca deste campo defunto explodirá no Anti-Regression pipeline.

# ADR 001: Semantic Governance Shell

**Data:** Abril 2026  
**Status:** Fechado / Adotado  
**Contexto Operacional:** v1.2.0

## Contexto & O Problema
A shell inicial (MVP) produzia "insights" usando Math.random() num motor simulado híbrido no cliente (Language/Decision engines) e lia pontuações semânticas desgarradas na Store Global (`globalScore`, `themeScores`). Isto levantou dois problemas urgentes à medida que o ecossistema Mini-App evoluiu:
1. **Risco de Hallucinação Semântica e Perda de Factos:** A UI formatava texto que não espelhava o real estado biométrico do utilizador, descredibilizando os exames puramente factuais.
2. **Conflito de Arquiteturas:** O Backend determinístico substituiu a mecânica, mas canais paralelos de UI mantinham as strings aleatórias para preencher espaços vazios (`insufficient_data`).

## Decisão
1. **Remoção de lógicas generativas no Client Side.** Foi deletado o `engines.ts`.
2. **Isolamento de State:** A source de truth semântica reside estritamente na abstração Backend via `SemanticOutputService.getBundle()`.
3. **Instalação de Fallback Guards Rigorosos (`guardrails.ts`)**: Introdução de mecanismos que provocam `throw` ativamente no percurso UI se encontrarem keys da API obsoletas (ex: `themeScores`), obrigando a developer ao compliance na arquitetura. Em `__DEV__` a shell rebenta ruidosamente; em Produção faz-se bypass limpo para `status: 'error'`, escondendo a regressão numa mensagem nativa da aplicação sem quebrar o flow.
4. **Adapter Unificado de Copy (UX):** As definições de linguagem PT-PT para falhas vs estado (ex: Diferenciar `error` técnico de `insufficient_data` biográfica) deixaram os ecrãs dispersos e uniram-se num single-file adapter `src/services/insights/index.ts`.
5. **Integração Jest & Gatekeeper Local:** Uma verificação de string-matching CLI impede que Code PRs tragam para o core imports das classes legacy.

## Consequências Positivas
- Garantia de 100% de coerência determinística: o que o backend e algoritmos decidem, é garantidamente o texto que apoia o utilizador.
- Ecrãs mais limpos, focados em Presentation (sem lógica de decisão biográfica emaranhada em renders de React).
- Bloqueio imediato na pipeline de injeções indevidas a mini-apps.

## Trade-offs Aceites
- Componentes desenhados originalmente para MVP (e.g. `OrbitalCarousel.tsx`) tornaram-se não-viáveis para adaptação e foram simplesmente purgados da infraestrutura, exigindo que futuras interações dependam inteiramente e de raiz do estado central mapeado e asserido.
- Deprecar as keys antigas na Bridge de mini apps legadas forçou a exportação destas como `undefined` (para evitar valores nulo enganosos como *score: 0*); apps antiquadas que dependiam ativamente deste payload podem falhar silenciosamente ou gerar ecrãs vazios se não possuírem *fallbacks* próprios resilientes na receção. Aceitou-se isto em prol de impedir telemetria desonesta.

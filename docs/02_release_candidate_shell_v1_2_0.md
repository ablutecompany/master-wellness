# Release Note Técnica: Semantic Shell v1.2.0

## 1. Visão Geral (O que ficou operacional)
A v1.2.0 encerra o sunset do antigo motor mockado e concretiza a transição para um **Semantic Engine Determinístico** e centralizado, com blindagem de pipeline. Transformou a shell e os mini-apps em ambientes previsíveis, isolando a computação de insights na *layer* de backend que é testável, localizadamente mockável via explícitas *fixtures*, livre de LLMs generativos arbitrários, e protegida por CI.

## 2. Inventário do Sistema Ativo
- **Domínios Operacionais (6):** `general`, `sleep`, `nutrition`, `energy`, `recovery`, `performance`.
- **Contrato Front-End Principal:** `DomainSemanticBundle` (fornecido por output-service), agora contendo o nó estático transversal `crossDomainSummary`.
- **Contrato Mini-apps:** O único contrato legal p/ Injeção em miniapps em React Native via container Bridge é a topologia de `domainPackages`.
- **Separação de Preocupações (Frontend):** 
  - *Ecrãs Factuais* (`AnalysesScreen`, `ProfileScreen`): Estritamente imunes a texto semântico/copys.
  - *Ecrãs Interpretativos / Shell Narrative* (`ThemesScreen`, Módulo AI Lateral na `HomeScreen`): Alimentam-se estritamente do `semanticOutputService`.
  - *Módulo Cross-Domain:* Alojado pacificamente no Topo da secção lateral 'Temas' da Home. Visível apenas se ocorrerem eventos de exaustão ou otimismo ambíguo confirmados no nó transversal.

## 3. Limpezas e Deprecações (The Sunset)
Foram removidos estrutural e permanentemente:
- O antigo `derivedContext` e referências ao property bag "estilo legacy". Removido do runtime das minis, store de contexto, ponte do container e tipos.
- Os scores gerados ao calhas (*Randomized Engines*) e a velha `engines.ts`.
- Mockup manual ou *themesScores* injetados imperativamente nos Screens. Se não está no bundle json governado pelo backend, não é impresso.

## 4. O Sistema de Governação (Guardrails e Anti-Regression)
O sistema tem agora proteções *hard-coded* na base de código impedindo que desenvolvedores revertam o estado e burlem o determinismo:
- **Testes de Contrato:** Variantes do *fixture json* previnem drift (`semantic-bundle-contract.test.ts`, `domain-packages-contract.test.ts`).
- **Pipeline CI e Run-Commands Obligatórios:** Integração ativada (se hooks e actions existirem). Na dúvida, corre-se localmente o `npm run test:guard` pre-commit que lança *scanners nativos* (`scripts/anti-regression.js`).
- Prevenção *Ast-Based*: Proibição rígida de uso da keyword estrita "derivedContext" no código compilável (*Anti-regression check*).

## 5. Secção LIMITES: O que NÃO REABRIR (Inegociável)
De acordo com os princípios balizados para as fundações, abstenha-se terminantemente de:
- **`derivedContext`:** Não reinserir. Está deprecado com intenção.
- **LLM/OpenAI Arbitrário:** A computação do semântico deve permanecer determinística para preservar auditabilidade do paciente e integridade de saúde dos outputs da app. Não ligue geradores textuais ou GPTs livres ao engine de *scoring/insights*.
- **Poluição em Telas de Biometria:** Não introduzir blocos semânticos nos Ecrãs Puros (`AnalysesScreen`). O factual e a interpretação moram em janelas cognitivas diferentes das nossas Personas de User Experience.
- **Domínios Paralelos:** Não abra mais do que estes 6 domínios até à v1.3. O esforço computacional e carga na bridge para React Native deve solidificar nestes. Ativar "stress" ou "mindfulness" prematuramente violará o pipeline de teste de contrato sem inputs provados.

## 6. Checklist de Validação Pré-Release (Workflow Obrigatório)
- [ ] Rodar **`npm run test`** (Testes unários standard). Tem de bater verde (atualmente estabilizado em 27 testes).
- [ ] Rodar **`npm run test:guard`** (Executar a defesa Anti-regressão explícita). Nenhum resquício de código legacy detetado no output do script node.
- [ ] Passagem no pipe no push / PR de CI.
- [ ] Inspecionar Bridge do Runtime c/ Mini-App catalog: "O objeto window.ablute.derivedContext deve ser estritamente *undefined*".
- [ ] UI Check: Confirmar visualmente que o domínio Thematic Side Panel na HomeScreen carrega corretamente o *array* dos 6 domínios. E que, não havendo incoerências cruzadas forçadas artificialmente, o **header do Cross-Domain Summary fica em completo silêncio**.

## 7. Limitações Conhecidas Aceitáveis
- Erros de TypeScript/Lint relativos ao Prisma no backend (`@nestjs/common` no `domain-engine`). Estes constam como idiossincrasias do repositório local relativas a dependências de workspace e _não quebram_ o runtime provado pelos testes. Devem ser tratados fora do scope fechado.

# Workflow: Validação da Shell Semântica e Contractos da App

**Estado Oficial: IMPLEMENTADO VIA GITHUB ACTIONS**

A partir da v1.2.0, a estabilidade e a governança da Ablute App deixam de depender meramente de verificação manual. Todos os Commits e PRs são fiscalizados pelos Contratos de Fluxo. Segue-se a especificação operacional para developers de Front-end ou de Mini-Apps da plataforma.

---

## 1. Regras de Ouro Locais (Pré-Commit)

A pipeline na plataforma GitHub (`Semantic Guardian Pipeline`) fará **Fail-Fast** se for quebrada qualquer fundação estabelecida em `00_baseline_shell_semantica_v1_2_0`. Para poupar tempo em Continuous Integration, deve validar localmente:

1. **A Execução de Anti-Regressão**:  
   Correr `npm run test:guard`
   *Esta ferramenta impede imediatamente a inserção oculta ou desleixada de tokens como `Engine`, `globalScore` ou o desfeito `derivedContext`. É um regex-scanner rigoroso antes das árvores react.*

2. **A Execução do Jest Flow**:  
   Correr `npm run test`
   *Valida com fixtures dinâmicas as políticas transversais de todos os pacotes. Exemplo: um domínio falhou o Insight Textual? Em vez de erro catastrófico em produção renderiza visualmente PT-PT seguro e coerente. Este fail-soft deve passar à prova do Jest.*

---

## 2. A Pipeline de Continuous Integration (CI)

Se submeter a branch para o repositório (`push` ou abrir `pull-request`), o `.github/workflows/semantic-guardian.yml` inicia 2 Jobs críticos:

### Job 1: Anti-Regression Gate 🛡️
Um detetor impiedoso focado apenas na sanidade dos imports e expressões obsoletas nas áreas de source (`/src/*`). 
**Se este job falhar:** Significa que colou código de MVP, atalhou um import desativado, ou tentou pedir à bridge antiga fallbacks opacos (`derivedContext`).

### Job 2: Semantic Contract & Integrations 🧪
Só arranca se o Anti-Regression for claro. Avalia interativamente as "pontes" entre back e front.
**Se este job falhar:** Modificou a API do Reducer sem avisar, removeu um campo mandatório do SDK (`exposurePolicy`), ou quebrou a leitura do presenter na interface `getSemanticInsights`.

---

## 3. Em Caso de Falha da CI (Troubleshooting)

1. **Guardrail Disparou um erro silencioso durante a Suite de Teste:**
   *Motivo:* Tentou acoplar uma feature biográfica via bundle mas falhou ao omitir um Facto Mínimo Obrigatório.  
   *Ação:* Assegure que as regras de `validateSemanticBundleShape()` num cenário de Mock/TDD estão a ser alimentadas com formas íntegras (veja a pasta `__fixtures__`).

2. **Test:Guard rejeitou ficheiros nativos do meu PR:**
   *Motivo:* Adicionou menção à palavra restrita "derivedContext" no seu ficheiro.
   *Ação:* Exclua a menção. Essa porta não existe. Use exclusivamente `domainPackages`.

3. **DomainPackages Contract falhou com "property undefined":**
   *Motivo:* Retirou a property passiva (`packageVersion`, `exposurePolicy`) ou alterou a shape no bridge, o que quebrará o Runtime das mini-apps existentes (`Sleep Deep` ou `Nutri-Menu`).
   *Ação:* Reverta para as Fixtures estrita.

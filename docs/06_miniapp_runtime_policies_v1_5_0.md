# Políticas Runtime V1.5.0: O Manifesto em Ação Analítica

> Como o manifesto da MiniApp dita o comportamento em tempo real do ecossistema Semântico da Ablute Core.

## 1. Visão Geral
A versão 1.5.0 transforma o manifesto declarativo das MiniApps numa grelha de decisão **Runtime** dentro da Bridge. A partir de agora, as propriedades avulsas de governance afetam não só o que é libertado legalmente (`domains/versions` vistos na v1.4.0), mas **como e quando** a inteligência deve ser comunicada (`frescura e agregação global`).

## 2. Enforcement de `supportsCrossDomainSummary`
A Layer Coesiva da aplicação mãe calcula continuamente deduplicações entre domínios antagonistas (ex: Energia vs. Recuperação). Contudo, injetar uma string de recomendação ou um flag de "Esgotamento Adrenal" cruzado a uma mini-app que só avalia "Hidratação" seria irresponsável e assustador.

### ⚙️ Comportamento:
- Se declarar explícito `supportsCrossDomainSummary: true`:
  O `buildContextPayload` vai insuflar uma chave especial extra chamada `crossDomainSummary` fora do array de pacotes.
- Se não declarar ou setar `false`:
  A _Bridge_ garante ativamente que o objecto transitado omita essa propriedade integralmente.

### Uso Seguro no Cliente:
```javascript
const globalRead = AbluteSDK.getCrossDomainSummary(window.ablute, manifest);
if(globalRead) {
  // Safe to render deduplicatedRecommendations
}
```

---

## 3. Enforcement de `requiresFreshData` e Modos Ociosos
Determinações médicas/algorítmicas expiram (isStale). Atualmente a rede de "Frescura" encontra o threshold nas últimas 24 horas (86400000ms).

### ⚙️ Comportamento:
- Se declarar explicito `requiresFreshData: true` no manifesto e a Bridge detetar um payload computado há >24 horas:
  Ela vai instanciar uma restrição proativa. A property `exposurePolicy` do domínio em causa transita silenciosamente para `'stale_blocked'`. O array de factos/sinais reseta para `null/[]`, eliminando o risco do dev mostrar métricas caducas.
- Se o campo não for requerido: a Bridge transata em `'allowed'` aceitando a imprecisão temporal (adequado para métricas basais, como Perfil Bio ou Histórico de Composição que oscila menos ao longo da semana).

---

## 4. Tabela Final de Estados do SDK
Concebida para tipagem inequívoca sem "ifs" esparguete na MiniApp:

| Policy Status | Significado Computacional | Dever da UI Local |
| --- | --- | --- |
| `allowed` | Direitos Legais e Fisiológicos validados | Arranque normal do Widget |
| `unavailable` | Domínio autorizado mas sem dados vitais formados ou versão incompatível | Ecrã de Orientação "A aguardar avaliação" |
| `denied` | Revogação de partilha ou não concedido nativamente | Splash Screen de Consentimento Obrigatório |
| `missing` | Domínio não listado no manifesto ou bridge offline | Queda graciosa à Home / Ocultação |
| `unauthorized_by_manifest` | Chamada manual a um recurso que o seu Manifest não pediu | Panic Errror no Node, App colapsa/não carrega |
| **`stale_blocked`** | Bloqueado profilaticamente pela flag requiresFreshData | Ecrã de Orientação "Atualize o seu Ring/Registo" |

# Ablute Mini-App Manifest Enforcement (V1.4.0)

> Regras formais para a declaração de capacidades, permissões e consumo semântico no catálogo de Mini-Apps (`catalog.ts`).

## 1. Visão Geral
A arquitetura V1.4.0 abandona a exposição passiva de dados na _Bridge_. Anteriormente, uma app autorizada a ler "Dados de Sono" (`SLEEP_DATA_READ`) tinha acesso a todos os pacotes semânticos correspondentes. A partir desta versão, o sistema interseta a permissão legal do User com a **Declaração Explícita de Intenção do Developer**.

Se uma Mini-App não declarar no seu manifesto que pretende consumir um pacote de um domínio específico, e qual a versão suportada, a _Bridge_ rete-lo-á ativamente (exposição nula) para salvaguardar largura de banda e blindar vetores de segurança.

## 2. Novos Campos no Manifesto (Obrigatórios p/ Consumo Semântico)
No ficheiro `src/miniapps/types.ts`, a interface `MiniAppManifest` foi estendida:

```typescript
export interface MiniAppManifest {
  // ... campos antigos (id, permissions, url)
  consumedDomains?: string[];               // Ex: ['sleep', 'energy']
  supportedPackageVersions?: string[];      // Ex: ['1.2.0', '1.3.0']
  supportsCrossDomainSummary?: boolean;     // Capacidade de ler factos fundidos transversais
  bridgeContractVersion?: string;           // Ex: '1.4'
}
```

## 3. Comportamento e Enforcement na Bridge

A orquestração do payload (`src/services/miniapp-context/index.ts`) aplica heurísticas ativas aos pacotes:

1. **Domínio Não Declarado:** Se a Mini-App pedir ou tentar aceder a um `pkg.domain` que não exista no seu array `consumedDomains`, o pacote será apagado silenciosamente da ponte _runtime_ (será injetado como null). O Helper do SDK no frontend devolverá estado `missing`.
2. **Incompatibilidade de Versão:** Se a infraestrutura semântica do Backend/Core gerar um pacote v2.0.0, mas a app declarar que só suporta `supportedPackageVersions: ['1.2.0']`, a Bridge não apaga o pacote. Em vez disso, envia-o com a tipografia oca e a política mitigada para `exposurePolicy: 'unavailable'`.

A despromoção para `unavailable` é vital: garante que a interface da Mini-app exiba formalmente o ecrã/UI de "Sem Dados", prevenindo que a app _crushe_ silenciosamente ou atrofie UI ao deparar-se com objetos json que não sabe interpretar.

## 4. Atualização e Verificação no SDK de Cliente
Para acompanhar a _Bridge_, a Library do Cliente (o SDK que a Mini-App executa no lado da WebView, em `domain-packages.ts`) providencia dupla verificação com mensagens de erro formais na Consola se houver chamadas errantes:

```javascript
// O Helper v1.4 deteta abusos locais se lhe for passado o manifesto opcional
const { status } = AbluteSDK.resolvePackageState(context, 'mental', myManifest);

// Resultado se 'mental' não constar em myManifest.consumedDomains:
// status === 'unauthorized_by_manifest'
// E log: [AbluteSDK Security] Mini-App attempted to read undeclared domain "mental".
```

## 5. Como Adicionar Nova Mini-App
Ao adicionar um novo registo no `MINI_APP_CATALOG`:
1. Decida e declare o `category` principal da app.
2. Defina os arrays legais em `permissions` para autorização do Apple HealthKit / Health Connect.
3. Preencha o array de governação semântica em `consumedDomains` explicitando exatamente que pacotes semânticos precisa para o seu core loop.
4. Ancore qual a tipografia a respeitar listando os major.minors em `supportedPackageVersions`.

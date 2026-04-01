# Padrão de Consumo SDK V1.3.0 - Ablute Mini-Apps

> Documentação normativa para integração client-side (WebView/React Native) do ecossistema de Mini-Apps da Plataforma Ablute.

## 1. Visão Geral (O Paradigma V1.3.0)
A partir da V1.3.0, as mini-apps deixam de inspecionar arrays crus injetados pela _bridge_. Em vez de varrerem manualmente o objeto global `window.ablute.domainPackages` em busca de domínios com base em lógicas imperativas soltas, o consumo do contexto semântico passou a ser efetuado através de uma **Camada Polimórfica (SDK Helpers)**.

## 2. O Que é Estritamente Proibido
Se estiver a construir ou a migrar uma Mini-App, **não faça** o seguinte:
- ❌ **Aceder a `derivedContext`:** Está deprecado. Tentar aceder a `window.ablute.derivedContext` produzirá `undefined` em produção e quebrará a sua app.
- ❌ **Parsing Bruto do `domainPackages`:** Nunca faça `domainPackages.find(p => p.domain === 'meu_dominio')`. Se as validações de shape falharem do lado da _bridge_ ou se a estrutura de dados sofrer updates de tipologia, a sua app irá apresentar erros fatais e vazar estados inconsistentes para a UI (mostrando um score vazio numa conta que não consentiu partilha, por exemplo).
- ❌ **Ifs em Cadeia para Permissionamento:** Não tente deduzir permissões a partir dos valores crus. Delegue essa responsabilidade aos agregadores de estado providenciados.

---

## 3. Os Helpers Oficiais (A Usar Sempre)
Importe/utilize o objeto SDK (oferecido via _bridge_ e tipado em `src/miniapps/contracts/domain-packages.ts`) que expõe um kit utilitário seguro.

### A) Resolver o Estado da App (`resolvePackageState`)
Em vez de inspecionar todo o payload, entregue ao Helper a decisão sobre se deve carregar a sua app.
```javascript
const { status, pkg } = AbluteSDK.resolvePackageState(window.ablute, 'nutrition');
```

**Estados Obrigatórios a Tratar:**
- `allowed`: A sua Mini-App tem consentimento do User para ler dados e a _Shell_ libertou dados processados. Pode arrancar a sua experiência real e chamar dados.
- `denied`: O User revogou o acesso da sua Mini-App à Shell. Deve mostrar um ecrã explícito: "Sem Permissão".
- `unavailable`: A permissão foi dada, mas a biometria/factos que sustentam a computação não existem (ex: o user nunca marcou um prato ou calibrou um scan facial). Deve exibir UI orientando o user a realizar exames.
- `missing`: Segurança. Evidencia que a própria _bridge_ colapsou ou que a sua string de domínio tem *typos* ou não foi registada globalmente no manifesto.

### B) Extração de Sub-recursos Seguro
Uma vez garantido o status `allowed`, **não percorra o objeto inteiro** (`pkg.signals` ou `pkg.facts` e afins manualmente quebrando a inferência de tipo). Devolva as listas apenas com getters validados contra _null pointers_ pela bridge:

```javascript
// Obtém o envelope avaliativo para mostrar o Score Global Semântico (ex: 85%)
const signals = AbluteSDK.getPackageSignals(window.ablute, 'sleep'); 

// Obtém o material biográfico frio que sustenta os _insights_
const facts = AbluteSDK.getPackageFacts(window.ablute, 'sleep');     
```

## 4. Telemetria V1.3 (Obrigatório)
O consumo de dados sensíveis na Bridge é agora auditável passivamente pela Shell. Sempre que a sua aplicação invocar com sucesso o arranque e descodificar um payload `allowed`, é obrigatório emitir o _acknowledgement_ legal para a Main Thread:

```javascript
window.ablute.emit('package_read', { 
    domain: 'nutrition', 
    version: pkg.packageVersion,
    policy: 'allowed'
});
```

Este padrão está provado E2E com cobertura aplicacional total de CI na baseline V1.3.0. Evite fricções operacionais utilizando-o nativamente.

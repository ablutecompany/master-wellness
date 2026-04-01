# Telemetria & Bridge Audit Trail (V1.6.0)

> Registo estruturado de decisões de Routing Semântico para QA e Observabilidade, garantindo zero Black Boxes na Bridge.

## 1. Visão Geral
A _Platform Bridge_ da Aplicação recusa-se agora a ser passiva. Sempre que a classe de Payload é invocada para compilar e libertar Contexto a uma Mini-App, ela não se esconde filtrando propriedades à socapa; em vez disso, produz um **Rasto Auditável (`BridgeDecisionLog`)**. O payload final enviado pela rede à _WebView_ continua perfeitamente higienizado e leve (sem as tags de razões e erros amontoadas). Contudo, a Aplicação Mãe consegue inspecionar o que aconteceu nos bastidores através da variável em cache do index `getLastAuditLog()`. 

Este audit trail serve o propósito de debug e de resposta operacional: permite responder imediatamente por que razão a _Nutri App_ parou de mostrar a pontuação ontem sem precisarmos de ler os seus códigos-fonte puros.

## 2. Decision Reason Codes (Dicionário Normativo)
Em V1.6, a _Bridge_ só aceita taxonomia forte, blindada pelo Type: `DecisionReasonCode`.

| CÓDIGO DA RAZÃO | TIPO DE OCORRÊNCIA | AÇÃO APLICADA | EXPOSURE POLICY INJETADA |
| :--- | :--- | :--- | :--- |
| **`PACKAGE_ALLOWED`** | Sucesso Total. Domínio declarado, versão aceite e permissão nativamente ativa. | Envio total de facts/signals | `'allowed'` |
| **`PERMISSION_DENIED`** | O User não concedeu permissão mãe AppleHealth/App. | Envio parcial bloqueado c/ disclaimer legal. | `'denied'` |
| **`DOMAIN_NOT_DECLARED`** | A mini-App não tem a keyword na sua whitelist de `consumedDomains`. | Retenção / Dropped Null. | `null / N.A.` |
| **`PACKAGE_VERSION_UNSUPPORTED`** | Core semantic engine gerou modelo inaudito incompatível com a V da app. | Purga de propriedades com resguardo de falha UI. | `'unavailable'` |
| **`STALE_BLOCKED_BY_POLICY`** | Dados retidos pelo limitador cronológico das 24H a pedido the freshData do Manifest. | Purga de insights sensíveis. | `'stale_blocked'` |
| **`PACKAGE_UNAVAILABLE`** | O modelo validou tudo, mas de facto a app mãe não tem exames médicos na conta. | Envio limpo vazio. | `'unavailable'` |
| **`CROSS_DOMAIN_NOT_SUPPORTED`**| Opcional não aderido via `supportsCrossDomainSummary: false`. | CrossDomain é truncado para undefined globalmente. | N/A |

## 3. Inspeção e Uso Local para Debug

Se precisar de escalar uma issue para a pipeline, obtenha o Snapshot exato na MainThread invocando o decorador de QA:

```javascript
import { getLastAuditLog } from './services/miniapp-context';

const report = getLastAuditLog('nutri-menu');
console.table(report.packageDecisions); 

// output exemplo na consola:
// [ { domain: "nutrition", policyApplied: "allowed", reasonCode: "PACKAGE_ALLOWED", timestamp: 167389... }
//   { domain: "sleep", policyApplied: null, reasonCode: "DOMAIN_NOT_DECLARED", timestamp: 167389... } ]
```

## 4. Integração Analítica (Telemetria)
Estes Decision Logs servem como material ideal para push assíncrono à Engine de Analytics Ablute. Ao invés de medirmos que X vezes a Mini-App *crushou*, conseguimos catalogar que X mil vezes o "General Wellness" foi expurgado numa semana por `STALE_BLOCKED_BY_POLICY`. Isso prova eficácia do ecossistema e orienta a adoção tática por parte de novos produtores de Mini-apps perante a rigidez das nossas políticas biográficas.

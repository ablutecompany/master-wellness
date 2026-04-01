# Handoff Técnico – Semantic Shell v1.2.0

> Documento fonte-de-verdade para equipas na transição pós-v1.2.0. Leia obrigatoriamente antes de adicionar Features na base de código Ablute Core.

## 1. Estado Atual Real
A aplicação possui um pipeline que calcula scores de vitalidade a partir de medições reais de *Hardware/Forms* (Factual > Semantic). 
- O backend injeta as avaliações (*Semantic Bundle*).
- O Frontend Redux capta, gere em payload *Typescript* estrito.
- A shell principal React Native expõe as leituras na sua Home (via painel de Deslize).
- A bridge providencia fragmentos parcelares dessas leituras (*Domain Packages*) a todas as Mini Apps.
A estabilidade não pode ser furada por novos atalhos. O workflow `request -> engine -> harmonization -> presenter -> UI` está fixado. 

## 2. Contratos Ativos de Plataforma
O seu novo norte magnético é duplo:
1. **`DomainSemanticBundle`**: Padrão REST/Typescript estático. Este JSON governa a Shell. 
2. **`domainPackages`** e **`requestedDomains`**: Padrão do SDK. Protegem a bridge e são a constituição para desenvolvimento de futuras Mini Apps Ablute.

## 3. Regras de Ouro (Governance Boundaries)
Se entrar neste projeto a partir da v1.3, saiba que há decisões seladas e não-disputáveis:
- **Sem Magia de Strings:** Copys em PT-PT são passados diretamente na construção do bundle determinístico no backend ou mapeados numa factory local restrita no Adapter do Frontend; nunca gerados textualmente por um modelo ao vivo.
- **Zero Legado:** Qualquer PR que inclua `derivedContext`, ou prop-drill do objeto genérico em React causaria chumbo de pipeline pelo scanner Anti-regressão. O runtime é assético e limpo.
- **Ecrãs Segregados:** UI's Factuais contêm apenas métricas frias. UI's Interpretativas fornecem a narrativa. Não deve criar resumos generalistas no ecrã de Resultados.

## 4. Integração Cross-Domain (Regra Geral Mestre)
Existe uma instância **Cross-Domain Coherence Engine** (*backend/src/domain-engine/cross-domain-coherence.service.ts*). Este serviço tem poder hierárquico sob métricas pontuais, impedindo paradoxos (como uma energia negativa a par de um status "Perfeito" no motor General). Alterações críticas em regras biológicas devem ser formalizadas nesta abstração, e nunca tratadas escondendo props no adapter de Frontend ou criando *If/Else* manhosos nos componentes de vista React Native.

---

## 5. Backlog Imediato Recomendado para V1.3
Áreas que podem ser abertas sem macular a arquitetura v1.2.0, e sugeridas para próximo avanço:

1. **Expansão de Mini-Apps Consumidoras:** Refatorar o ecossistema subjacente de Mini-Apps para utilizarem ativamente `domainPackages` focadas e limpas (ex: Hidratação vs. Sistema Urinário).
2. **Hardening da Metadata:** Refinar as tipagens soltas de metadados do engine transversal e alargar o escopo de invalidação formal por afinidade na pasta `domain-affinity.ts`. 
3. **Mecânica de Recomputação Parcial:** Refinar a engine para granularidade de recálculo (ex: recalcular apenas "Desempenho" e "Energia" se chegar uma métrica local que não intersete com "Sono").
4. **Copy Refinement e Priorização Tática:** Expansão algorítmica na deduplicação do `CrossDomainCoherenceService` para detetar falsos positivos contextuais mais finos (ex: Jejum Noturno e a sua ressonância global versus Sono).
5. **Telemetria de Comportamento Fina:** Analítica superior onde eventos detalhados baseados no facto do user visualizar explicitamente uma _Recommendation_ gerem um Post de resposta interativa no lado do utilizador real (tracking comportamental de engagement).
6. **Explicabilidade:** Fornecer aos painéis de Themes da app _caminhos de migalhas reais_ ao user (tipo: *"Esta recomendação existe porque a tua Glicose e Hidratação desceram"*), usando dados diretamente rastreáveis e extraíveis das referências documentados pela infraestrutura existente. 

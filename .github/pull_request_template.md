## 🎯 Objetivo da PR
<!-- Explique sucintamente o que esta PR pretende resolver ou introduzir. -->

---

## 🛡️ Checklist de Governação Semântica
> **Atenção:** A Codebase Ablute opera sob uma política estrita anti-regressão e governação semântica v1.2.0. Por favor confirme as políticas abaixo.

- [ ] **Semântica:** A PR não ignora o `InsightsAdapter` para gerar texto biográfico a partir de variáveis brutas na `HomeScreen` ou `ThemesScreen`.
- [ ] **Ecrãs Factuais:** Os ecrãs de registos (`ProfileScreen`, `AnalysesScreen`) continuam puramente factuais e não foram contaminados com Copywriter Semântico.
- [ ] **Fidelity:** Testou o comportamento local para `error` e `insufficient_data`? Valida que o copy nesses casos não desaba?
- [ ] **Bridge:** Se injetou ou alterou contextos para as Mini-Apps, usou o array isolado do `domainPackages` no lugar de `derivedContext` (que é probido)?
- [ ] **Pipeline:** Corri `npm run test` localmente e os Contracts mantiveram-se verdes.
- [ ] **Gatekeeper:** Corri `npm run test:guard` pre-commit e confirmei zero dependências legacy recuperadas.

## 🧱 Dependências / Alterações Arquaturais?
<!-- Se alterou o Store Global, Models Base ou o Adapter principal, marque os Code Owners ou deixe justificação extensa de segurança. -->
- N/A

## 📸 Snapshots Visuais / Prova de UI (Opcional)
<!-- Se afetar a UI, introduza screenshots. Caso contrário, ignore. -->

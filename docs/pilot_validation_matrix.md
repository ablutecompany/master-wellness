# Matriz de Validação Operacional — Pilot Ready (M8)

Este documento define os casos de teste críticos para declarar a plataforma `ablute_ wellness` pronta para pilotos reais.

## 1. Critérios de Aceitação (Pass/Fail)

A plataforma é considerada **Pronta para Piloto** se:
- Todos os casos de Severidade **Bloqueador** e **Alto** passarem.
- Erros de rede ou backend são tratados com mensagens amigáveis ou estados vazios (não quebram a UI).
- O isolamento entre Modo Real e Modo Demo é absoluto (zero fugas de dados).

---

## 2. Matriz de Testes Ponta-a-Ponta (E2E)

| ID | Fluxo | Caso de Teste | Severidade | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **T01** | Auth | Login via Supabase + Redirecionamento | **Bloqueador** | App entra na HomeScreen com sessão válida e token no store. |
| **T02** | Boot | Recuperação de Perfil e Análise Ativa | **Bloqueador** | O store reflete o `active_analysis_id` persistido na DB. |
| **T03** | Boot | Carregamento de Histórico Real | **Alto** | O menu Histórico mostra a lista correta de análises da BD. |
| **T04** | Histórico | Troca de Análise Ativa | **Alto** | Ao mudar no histórico, a UI atualiza (Resultados/Leitura) e o novo ID é persistido. |
| **T05** | Persistência | Refresh da App (F5/Reload) | **Bloqueador** | A App deve manter-se autenticada e na mesma análise ativa anterior. |
| **T06** | AI | Geração de Novo Insight (Análise Real) | **Alto** | Gera insight canónico (M4), persiste na DB e apresenta na UI. |
| **T07** | AI | Reutilização de Insight (Persistence) | **Médio** | Ao voltar a uma análise já lida, o insight aparece instantaneamente (via DB). |
| **T08** | Isolamento | Ativação do Modo Demo | **Bloqueador** | A App muda para dados simulados. Zero chamadas de escrita para o Backend/DB real. |
| **T09** | Erro | Timeout do Backend | **Médio** | UI mostra "Problema de ligação" em vez de um ecrã branco ou erro indefinido. |
| **T10** | Erro | Token Expirado | **Alto** | Redireciona para o login ou limpa a sessão de forma graciosa. |

---

## 3. Ordem de Execução Recomendada

1. **Infra**: Validar `/health` e `/ready` (M6).
2. **Auth**: Fluxo de Login completo.
3. **Dados**: Verificar se análises reais aparecem.
4. **AI**: Testar geração e persistência de insights.
5. **Robustez**: Testar refresh e modo demo.

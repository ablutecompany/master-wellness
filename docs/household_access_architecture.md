# Arquitetura de Acesso e Agregado Familiar (Household)

Este documento define a arquitetura funcional e o modelo conceptual para a gestão de agregados familiares, perfis multi-persona e partilha granular de dados na plataforma ablute_wellness.

## 1. Visão Funcional

A arquitetura estabelece uma separação rigorosa entre três conceitos:
- **Conta (Account)**: Identidade autenticada (login via Supabase Auth); Contentor de faturação e gateway de acesso.
- **Pessoa (Person/Profile)**: Perfil biométrico real a quem pertencem, de forma soberana, todas as análises e recomendações.
- **Acesso (Access/Permission)**: Permissões explícitas concedidas a uma Conta para ver ou gerir dados de uma Pessoa.

A formulação base é:
- Uma conta pode gerir várias pessoas.
- Uma pessoa pode ou não ter conta própria.
- Um telemóvel pode servir várias pessoas.
- A análise pertence sempre à pessoa.
- O acesso depende das permissões.

---

## 2. Definições de Estado de Utilização

### 2.1. Authenticated (Autenticado)
- Utilização com persistência real em base de dados cloud.
- Suporte total a agregado familiar e partilha.
- Garantia de continuidade de dados entre dispositivos.

### 2.2. Guest (Convidado)
- Uso local limitado.
- Sem garantias de continuidade ou persistência real em base de dados cloud.
- Objectivo: experimentação rápida de interface.

### 2.3. Demo (Simulação)
- Simulação controlada com dados fictícios.
- Sem valor de persistência real; apenas para demonstração de capacidades.

---

## 3. Modelo de Papéis (Roles)

### 3.1. Administrador do Agregado
- Utilizador que cria e governa o Household.

### 3.2. Dependente (Caso-Base Estrutural)
- Perfil criado e gerido pelo Administrador (ex: filho/criança).
- **Sem conta própria**: Não possui credenciais de login.
- **Propriedade**: As análises pertencem estritamente ao Perfil do Dependente, não ao adulto que executou a acção.

### 3.3. Membro Ligado (Com conta própria)
- Adulto com conta ablute_wellness autónoma que adere a um agregado por convite.
- **Soberania**: O membro mantém a propriedade total dos seus dados.
- **Acesso Granular**: O Administrador **não ganha acesso total por defeito**. O acesso requer convite, aceitação e escolha explícita de escopo.
- **Revogação**: O acesso pode ser revisto ou revogado pelo Membro Ligado a qualquer momento.

---

## 4. Regra da Pessoa Ativa (Mandatória)

Antes de cada análise ou consulta de métricas, **é obrigatória a confirmação explícita da pessoa ativa** na interface.
- Não pode ficar implícito.
- Evita a mistura acidental de dados entre membros (ex: pai submeter análise do filho no seu próprio perfil).
- Garante a integridade da "Cadeia de Propriedade".

---

## 5. Modelo de Dados Conceptual

As entidades operam na cadeia: **Conta -> Pessoa -> Acesso -> Análise -> Recomendação**.

- **`profiles`**: Representa a identidade autenticada (Account-level); Liga-se ao Auth.
- **`households`**: Representa o grupo familiar; Liga-se a um Administrador e vários membros.
- **`member_profiles`**: Representa a Pessoa real (perfil biométrico); Chave de soberania dos dados.
- **`household_membership`**: Define quem pertence a que agregado; Liga `member_profiles` a `households`.
- **`sharing_scopes` / `access_grants`**: Define permissões granulares; Liga uma Conta (Admin/Membro) a um Perfil alheio.
- **`analyses`**: Registo de entrada de dados; Pertence estritamente a um `member_profile_id`.
- **`analysis_insights`**: Interpretação técnica da IA; Pertence a uma `analysis`.
- **`structured_recommendations`**: Dados acionáveis finais (JSON); Pertence a uma `analysis` e a um `member_profile_id`.

---

## 6. Cadeia de Propriedade e Integração

### Hierarquia de Dados
1. Cada **Analysis** nasce associada a um **Member Profile**.
2. O **Insight** é derivado dessa análise específica.
3. A **Structured Recommendation** é o produto final para consumo do ecossistema.

### Integração com Meal Planner
- O Meal Planner consome **apenas dados estruturados autorizados** (Structured Recommendations).
- A integração é feita **por pessoa** e focada no domínio **`nutrition`** ou equivalente.
- Nunca consome a narrativa direta da AI nem depende de texto livre do Insight.

---

## 7. Fluxos UX Nucleares

### 7.1. Gestão de Dependentes
1. **Criação de perfil dependente**: Admin cria perfil sem conta (ex: filho). Os dados pertencem ao filho, mas o Admin gere.
2. **Seleção de Pessoa Ativa**: **Antes de cada análise**, a UI exige confirmação de quem é a pessoa ativa (Obrigatório).

### 7.2. Ligação entre Adultos
1. **Convite**: Admin convida alguém com conta própria para o seu Household.
2. **Aceitação**: O convidado aceita formalmente a entrada no grupo.
3. **Escopo de Partilha**: O convidado escolhe que domínios partilha (ex: só `nutrition`).
4. **Revisão/Revogação**: O membro ligado pode alterar ou remover permissões a qualquer momento.

---

## 8. Ordem Recomendada de Implementação

1. **Portal de Entrada + Auth Correto**: Ponto de partida obrigatório.
2. **Perfil Persistido**: Conta persistente na cloud.
3. **Household/Agregado Mínimo**: Contentor lógico.
4. **Member Profile**: Criação da entidade Pessoa independente.
5. **Pessoa Ativa**: Implementação do switch de contexto na UI.
6. **Analysis -> Member Profile**: Propriedade real dos dados.
7. **Structured Recommendations**: Camada de dados para consumo externo.
8. **Meal Planner**: Integração final via domínio autorizado.

## 9. RISCOS A EVITAR

1. **Confusão Conta/Perfil**: Permitir que o código use Account ID onde deveria usar Member Profile ID.
2. **Propriedade Indevida**: Associar uma análise à conta do Admin em vez da pessoa ativa (ex: filho).
3. **Excesso de Partilha**: Assumir acesso total (`all`) por defeito em convites entre adultos.
4. **Integração Frágil**: Meal Planner ler texto livre das AI Insights em vez de JSON estruturado.
5. **Erro de Contexto**: Executar análises sem confirmação explícita da pessoa ativa.


## 10. CASOS-BASE DE PRODUTO

- **Pai/Filho**: O Pai (Admin) cria perfil do Filho (Dependente). Faz análises que ficam no perfil do Filho. O Pai gere tudo.
- **Adulto Externo**: Esposa convida Marido. Marido aceita e partilha **apenas `nutrition`**. Esposa vê dados alimentares, mas não vê sono.
- **Meal Planner**: Utilizador abre planeamento para o Filho. A app consome apenas recomendações de `nutrition` do perfil do Filho.


## 11. DECISÕES QUE FICAM JÁ FECHADAS PARA IMPLEMENTAÇÃO FUTURA

- 1 conta pode gerir várias pessoas.
- 1 pessoa pode não ter conta própria.
- 1 telemóvel pode servir várias pessoas.
- 1 análise pertence sempre a 1 pessoa.
- O acesso é governado por permissões (Scoping) e domínios.
- O Meal Planner usa apenas dados estruturados autorizados.

---
*Fim do documento final de referência.*

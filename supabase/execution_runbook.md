# Execution Runbook — Schema Wellness

## Pré-requisitos

1. Projecto Supabase activo com acesso ao SQL Editor
2. Acesso ao Dashboard > Authentication > Users
3. Ficheiros prontos no directório `supabase/`:
   - `schema_all_aligned.sql`
   - `seed_minimal.sql`
   - `manual_validation_queries.sql`
   - `smoke_tests.md`

---

## Passo 1 — Criar 2 utilizadores Auth

1. Abrir Dashboard > Authentication > Users
2. Clicar "Add User" > "Create New User"
3. Criar utilizador 1 (ex: `user1@wellness.local`, password qualquer)
4. Criar utilizador 2 (ex: `user2@wellness.local`, password qualquer)
5. Copiar os 2 UUIDs da coluna "UID" da tabela de utilizadores

---

## Passo 2 — Substituir placeholders no seed

1. Abrir `seed_minimal.sql`
2. Localizar as 2 linhas de placeholder:
   - `v_user_1 uuid := '00000000-0000-0000-0000-000000000001';`
   - `v_user_2 uuid := '00000000-0000-0000-0000-000000000002';`
3. Substituir pelos UUIDs reais copiados no Passo 1

---

## Passo 3 — Substituir placeholders nas queries de validação

1. Abrir `manual_validation_queries.sql`
2. Substituir todas as ocorrências de `<UUID_USER_1>` pelo UUID real do utilizador 1
3. Substituir todas as ocorrências de `<UUID_USER_2>` pelo UUID real do utilizador 2

---

## Passo 4 — Executar schema

1. Abrir SQL Editor no Dashboard Supabase
2. Colar o conteúdo completo de `schema_all_aligned.sql`
3. Executar

**Resultado esperado:** Success, sem erros.

**Se falhar:**
- Erro `relation "auth.users" does not exist` → o projecto não tem schema Auth; verificar configuração Supabase
- Erro `relation already exists` → schema já foi executado antes; fazer drop das tabelas ou usar projecto limpo

---

## Passo 5 — Executar seed

1. No SQL Editor, colar o conteúdo de `seed_minimal.sql` (já com UUIDs reais)
2. Executar

**Resultado esperado:** Mensagem `NOTICE: Seed concluído. user_1=..., user_2=..., analysis_1=..., analysis_2=..., analysis_3=...`

**Se falhar:**
- Erro `insert or update on table "profiles" violates foreign key constraint` → os UUIDs não existem em `auth.users`. Voltar ao Passo 1 e confirmar que os utilizadores foram criados e que os UUIDs estão corretos.
- Erro `active_analysis_id não pertence ao utilizador` → lógica do seed está a tentar atribuir analysis errada; verificar se o seed não foi alterado.

---

## Passo 6 — Executar queries de validação

Correr cada bloco de `manual_validation_queries.sql` individualmente no SQL Editor, pela ordem:

| Bloco | O que valida | Resultado esperado |
|-------|-------------|-------------------|
| 1 | Profiles criados | 2 linhas |
| 2 | Analyses por owner_id | 3 linhas (2 user1, 1 user2) |
| 3 | active_analysis_id | user1 com ownership_valido=true, user2 nulo |
| 4 | Medições da analysis ativa | 9 linhas, 4 categorias |
| 5 | Events da analysis ativa | 1 linha |
| 6 | Insights da analysis ativa | 1 linha |
| 7 | updated_at em profiles | timestamp muda após update |
| 8 | updated_at em analyses | timestamp muda após update |
| 9 | updated_at em analysis_measurements | timestamp muda após update |
| 10 | updated_at em analysis_insights | timestamp muda após update |
| 11 | Rejeição ownership cruzado | ERRO esperado |
| 12 | Queries auxiliares | contagem por categoria: urina=4, fisiologica=3, fecal=1, ecossistema=1 |

---

## Passo 7 — Validar RLS

1. Usar Supabase client library ou API REST com JWT do utilizador 2
2. Fazer `select * from analyses` → deve retornar apenas 1 linha (a do user 2)
3. Fazer `select * from analysis_measurements` → deve retornar 0 linhas
4. Fazer `select * from analysis_events` → deve retornar 0 linhas
5. Fazer `select * from analysis_insights` → deve retornar 0 linhas

**Se RLS não bloquear:**
- Verificar que `alter table ... enable row level security` correu sem erro
- Verificar que as policies existem: `select * from pg_policies where schemaname = 'public';`

---

## Passo 8 — Validar trigger auth.users → profiles

1. Criar um terceiro utilizador no Dashboard Auth
2. No SQL Editor: `select id, email, name from public.profiles order by created_at desc limit 1;`
3. Deve aparecer nova linha com email e name preenchidos automaticamente

**Se não aparecer:**
- Verificar que o trigger existe: `select * from information_schema.triggers where trigger_name = 'trg_auth_users_on_insert';`
- Se o trigger não existir, o schema não correu correctamente

---

## Passo 9 — Marcar resultado no smoke_tests.md

Abrir `smoke_tests.md` e marcar cada checkbox conforme os resultados obtidos.

---

## Interpretação de falhas

| Tipo de erro | Significado | Acção |
|-------------|------------|-------|
| FK violation em profiles | UUID não existe em auth.users | Confirmar que os utilizadores Auth existem com os UUIDs correctos |
| `active_analysis_id não pertence ao utilizador` | Trigger de ownership a funcionar correctamente | Este é o comportamento esperado no teste 11 |
| RLS não bloqueia acesso | Policies não foram criadas | Re-executar schema_all_aligned.sql ou verificar pg_policies |
| updated_at não muda | Trigger set_updated_at não activo | Verificar information_schema.triggers para a tabela em causa |
| Trigger auth→profiles não dispara | Trigger on auth.users não foi criado | Verificar se o schema correu sem erros na parte 2 |

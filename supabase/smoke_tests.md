# Smoke Tests — Schema Wellness Alinhado

## Pré-requisitos obrigatórios
1. Supabase project com acesso ao SQL Editor
2. Executar `schema_all_aligned.sql` no SQL Editor
3. Criar 2 utilizadores reais no Supabase Auth (Dashboard > Authentication > Users > Add User)
4. Recolher os 2 UUIDs reais desses utilizadores
5. Substituir os placeholders no `seed_minimal.sql` pelos UUIDs reais
6. Executar `seed_minimal.sql` no SQL Editor

---

## 1. Schema executa sem erro
- [ ] Colar `schema_all_aligned.sql` no SQL Editor
- [ ] Executar — zero erros

## 2. Seed executa sem erro
- [ ] Confirmar que os 2 utilizadores Auth existem
- [ ] Substituir os 2 placeholders UUID no `seed_minimal.sql`
- [ ] Executar — mensagem `Seed concluído` no output com os 5 IDs

## 3. Verificar dados inseridos
- [ ] `select count(*) from public.profiles;` → 2
- [ ] `select count(*) from public.analyses;` → 3 (2 do utilizador 1, 1 do utilizador 2)
- [ ] `select count(*) from public.analysis_measurements;` → 9
- [ ] `select count(*) from public.analysis_events;` → 1
- [ ] `select count(*) from public.analysis_insights;` → 1
- [ ] `select active_analysis_id from public.profiles where id = '<UUID_USER_1>';` → UUID não-nulo

## 4. Ownership — active_analysis_id aceita análise própria
- [ ] O seed já fez `update profiles set active_analysis_id = analysis_1` sem erro
- [ ] Confirmar:
```sql
select p.id, p.active_analysis_id, a.owner_id
from public.profiles p
join public.analyses a on a.id = p.active_analysis_id
where p.id = '<UUID_USER_1>';
```
- [ ] `p.id` = `a.owner_id` → ownership válido

## 5. Ownership — active_analysis_id rejeita análise de outro utilizador
- [ ] Obter o ID de uma analysis do utilizador 1:
```sql
select id from public.analyses where owner_id = '<UUID_USER_1>' limit 1;
```
- [ ] Tentar atribuir essa analysis ao utilizador 2:
```sql
update public.profiles
set active_analysis_id = '<ID_ANALYSIS_DO_USER_1>'
where id = '<UUID_USER_2>';
```
- [ ] Deve falhar com: `active_analysis_id não pertence ao utilizador`

## 6. Trigger updated_at
- [ ] Guardar valor actual:
```sql
select updated_at from public.profiles where id = '<UUID_USER_1>';
```
- [ ] Esperar 1 segundo, depois:
```sql
update public.profiles set name = 'Nome Alterado' where id = '<UUID_USER_1>';
```
- [ ] Verificar que `updated_at` mudou
- [ ] Repetir para `public.analyses`:
```sql
update public.analyses set title = 'Titulo Alterado'
where owner_id = '<UUID_USER_1>' limit 1;
```
- [ ] Verificar que `updated_at` mudou
- [ ] Repetir para `public.analysis_measurements`:
```sql
update public.analysis_measurements set label = 'Label Alterado'
where analysis_id = (select id from public.analyses where owner_id = '<UUID_USER_1>' limit 1)
limit 1;
```
- [ ] Verificar que `updated_at` mudou

## 7. RLS — acesso entre utilizadores bloqueado
- [ ] Autenticar como utilizador 2 (via Supabase client ou API com JWT do user 2)
- [ ] Executar: `select * from public.analyses;` → apenas 1 linha (a do utilizador 2)
- [ ] Executar: `select * from public.analysis_measurements;` → 0 linhas
- [ ] Executar: `select * from public.analysis_insights;` → 0 linhas
- [ ] Executar: `select * from public.analysis_events;` → 0 linhas

## 8. Queries por owner_id e analysis_id
- [ ] `select * from public.analyses where owner_id = '<UUID_USER_1>';` → 2 linhas
- [ ] `select * from public.analyses where owner_id = '<UUID_USER_2>';` → 1 linha
- [ ] `select * from public.analysis_measurements where analysis_id = (select active_analysis_id from public.profiles where id = '<UUID_USER_1>');` → 9 linhas

## 9. Trigger auth.users → profiles
- [ ] Criar um terceiro utilizador via Supabase Auth (Dashboard ou API)
- [ ] Verificar que `public.profiles` recebeu nova linha automaticamente:
```sql
select id, email, name from public.profiles order by created_at desc limit 1;
```
- [ ] Confirmar que `email` e `name` foram preenchidos a partir de `auth.users`

---

## Resultado
- [ ] 9/9 testes passam → schema operacional
- [ ] Algum teste falha → anotar qual e reportar

-- manual_validation_queries.sql
-- Executar depois de schema_all_aligned.sql e seed_minimal.sql.
-- Substituir <UUID_USER_1> e <UUID_USER_2> pelos UUIDs reais antes de correr.

-- ══════════════════════════════════════════════════════════════════════
-- 1. CONFIRMAR PROFILES CRIADOS
-- ══════════════════════════════════════════════════════════════════════

select id, email, name, active_analysis_id, created_at, updated_at
from public.profiles
order by created_at;

-- Esperado: 2 linhas (utilizador 1 e utilizador 2)

-- ══════════════════════════════════════════════════════════════════════
-- 2. LISTAR ANALYSES POR OWNER_ID
-- ══════════════════════════════════════════════════════════════════════

select id, owner_id, title, analysis_date, source, status
from public.analyses
order by owner_id, analysis_date desc;

-- Esperado: 3 linhas (2 do user 1, 1 do user 2)

-- ══════════════════════════════════════════════════════════════════════
-- 3. CONFIRMAR ACTIVE_ANALYSIS_ID
-- ══════════════════════════════════════════════════════════════════════

select
  p.id as profile_id,
  p.active_analysis_id,
  a.owner_id,
  a.title,
  (p.id = a.owner_id) as ownership_valido
from public.profiles p
left join public.analyses a on a.id = p.active_analysis_id
order by p.id;

-- Esperado:
--   user 1: active_analysis_id preenchido, ownership_valido = true
--   user 2: active_analysis_id nulo

-- ══════════════════════════════════════════════════════════════════════
-- 4. LISTAR MEDIÇÕES DA ANALYSIS ATIVA
-- ══════════════════════════════════════════════════════════════════════

select
  m.id,
  m.category,
  m.metric_key,
  m.label,
  m.value_numeric,
  m.value_text,
  m.value_boolean,
  m.unit,
  m.display_order
from public.analysis_measurements m
join public.profiles p on p.active_analysis_id = m.analysis_id
where p.id = '<UUID_USER_1>'
order by m.display_order;

-- Esperado: 9 linhas
--   urina: ph, nitritos, glicose, creatinina (display_order 1-4)
--   fisiologica: peso, temperatura, frequencia_cardiaca (display_order 5-7)
--   fecal: bristol_scale (display_order 8)
--   ecossistema: hydration_context (display_order 9)

-- ══════════════════════════════════════════════════════════════════════
-- 5. LISTAR EVENTS DA ANALYSIS ATIVA
-- ══════════════════════════════════════════════════════════════════════

select
  e.id,
  e.event_type,
  e.occurred_at,
  e.payload
from public.analysis_events e
join public.profiles p on p.active_analysis_id = e.analysis_id
where p.id = '<UUID_USER_1>';

-- Esperado: 1 linha (hydration_logged)

-- ══════════════════════════════════════════════════════════════════════
-- 6. LISTAR INSIGHTS DA ANALYSIS ATIVA
-- ══════════════════════════════════════════════════════════════════════

select
  i.id,
  i.provider,
  i.model,
  i.prompt_version,
  i.language,
  i.status,
  i.summary_text,
  i.output_json
from public.analysis_insights i
join public.profiles p on p.active_analysis_id = i.analysis_id
where p.id = '<UUID_USER_1>';

-- Esperado: 1 linha (openai, gpt-4o, status=ready)

-- ══════════════════════════════════════════════════════════════════════
-- 7. TESTAR UPDATED_AT — PROFILES
-- ══════════════════════════════════════════════════════════════════════

-- 7a. Guardar valor actual
select id, name, updated_at from public.profiles where id = '<UUID_USER_1>';

-- 7b. Atualizar (esperar 1 segundo antes de correr)
update public.profiles set name = 'Nome Alterado Teste' where id = '<UUID_USER_1>';

-- 7c. Verificar que updated_at mudou
select id, name, updated_at from public.profiles where id = '<UUID_USER_1>';

-- Esperado: updated_at de 7c > updated_at de 7a

-- ══════════════════════════════════════════════════════════════════════
-- 8. TESTAR UPDATED_AT — ANALYSES
-- ══════════════════════════════════════════════════════════════════════

-- 8a. Guardar valor actual
select id, title, updated_at from public.analyses where owner_id = '<UUID_USER_1>' limit 1;

-- 8b. Atualizar
update public.analyses set title = 'Titulo Alterado Teste'
where id = (select id from public.analyses where owner_id = '<UUID_USER_1>' limit 1);

-- 8c. Verificar
select id, title, updated_at from public.analyses where owner_id = '<UUID_USER_1>' order by updated_at desc limit 1;

-- Esperado: updated_at de 8c > updated_at de 8a

-- ══════════════════════════════════════════════════════════════════════
-- 9. TESTAR UPDATED_AT — ANALYSIS_MEASUREMENTS
-- ══════════════════════════════════════════════════════════════════════

-- 9a. Guardar valor actual
select id, label, updated_at from public.analysis_measurements
where analysis_id = (select active_analysis_id from public.profiles where id = '<UUID_USER_1>')
limit 1;

-- 9b. Atualizar
update public.analysis_measurements set label = 'Label Alterado Teste'
where id = (
  select m.id from public.analysis_measurements m
  join public.profiles p on p.active_analysis_id = m.analysis_id
  where p.id = '<UUID_USER_1>'
  limit 1
);

-- 9c. Verificar
select id, label, updated_at from public.analysis_measurements
where label = 'Label Alterado Teste';

-- Esperado: updated_at de 9c > updated_at de 9a

-- ══════════════════════════════════════════════════════════════════════
-- 10. TESTAR UPDATED_AT — ANALYSIS_INSIGHTS
-- ══════════════════════════════════════════════════════════════════════

-- 10a. Guardar valor actual
select id, status, updated_at from public.analysis_insights
where analysis_id = (select active_analysis_id from public.profiles where id = '<UUID_USER_1>')
limit 1;

-- 10b. Atualizar
update public.analysis_insights set status = 'generating'
where id = (
  select i.id from public.analysis_insights i
  join public.profiles p on p.active_analysis_id = i.analysis_id
  where p.id = '<UUID_USER_1>'
  limit 1
);

-- 10c. Verificar
select id, status, updated_at from public.analysis_insights
where status = 'generating';

-- Esperado: updated_at de 10c > updated_at de 10a

-- ══════════════════════════════════════════════════════════════════════
-- 11. TESTAR REJEIÇÃO DE ACTIVE_ANALYSIS_ID DE OUTRO UTILIZADOR
-- ══════════════════════════════════════════════════════════════════════

-- 11a. Obter uma analysis do utilizador 1
select id, owner_id from public.analyses where owner_id = '<UUID_USER_1>' limit 1;

-- 11b. Tentar atribui-la ao utilizador 2 (DEVE FALHAR)
update public.profiles
set active_analysis_id = (
  select id from public.analyses where owner_id = '<UUID_USER_1>' limit 1
)
where id = '<UUID_USER_2>';

-- Esperado: ERRO — active_analysis_id não pertence ao utilizador <UUID_USER_2>

-- ══════════════════════════════════════════════════════════════════════
-- 12. QUERIES AUXILIARES POR ANALYSIS_ID
-- ══════════════════════════════════════════════════════════════════════

-- 12a. Todas as medições de uma analysis específica
select category, metric_key, label, value_numeric, value_text, unit
from public.analysis_measurements
where analysis_id = (select active_analysis_id from public.profiles where id = '<UUID_USER_1>')
order by display_order;

-- 12b. Contagem de medições por categoria
select category, count(*) as total
from public.analysis_measurements
where analysis_id = (select active_analysis_id from public.profiles where id = '<UUID_USER_1>')
group by category
order by category;

-- Esperado:
--   ecossistema: 1
--   fecal: 1
--   fisiologica: 3
--   urina: 4

-- 12c. Analysis com todas as suas dependências (contagens)
select
  a.id,
  a.title,
  (select count(*) from public.analysis_measurements where analysis_id = a.id) as measurements,
  (select count(*) from public.analysis_events where analysis_id = a.id) as events,
  (select count(*) from public.analysis_insights where analysis_id = a.id) as insights
from public.analyses a
order by a.owner_id, a.analysis_date desc;

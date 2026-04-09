-- seed_minimal.sql
-- Depende de: schema_all_aligned.sql executado previamente.
-- Depende de: 2 utilizadores reais criados no Supabase Auth ANTES de executar este seed.
--
-- INSTRUÇÕES:
-- 1. Criar 2 utilizadores no Supabase Auth (Dashboard > Authentication > Users > Add User)
-- 2. Copiar os UUIDs reais desses utilizadores
-- 3. Substituir os placeholders abaixo pelos UUIDs reais
-- 4. Executar este script no SQL Editor com service_role

do $$
declare
  -- ╔══════════════════════════════════════════════════════════════════╗
  -- ║  SUBSTITUIR PELOS UUIDs REAIS DOS UTILIZADORES AUTH            ║
  -- ╚══════════════════════════════════════════════════════════════════╝
  v_user_1 uuid := '00000000-0000-0000-0000-000000000001';  -- SUBSTITUIR
  v_user_2 uuid := '00000000-0000-0000-0000-000000000002';  -- SUBSTITUIR

  v_analysis_1 uuid;
  v_analysis_2 uuid;
  v_analysis_3 uuid;
begin

  -- ── Profiles ────────────────────────────────────────────────────────
  insert into public.profiles (id, email, name)
  values (v_user_1, 'user1@wellness.local', 'Utilizador Principal')
  on conflict (id) do update
    set email = excluded.email,
        name  = excluded.name;

  insert into public.profiles (id, email, name)
  values (v_user_2, 'user2@wellness.local', 'Utilizador Secundario')
  on conflict (id) do update
    set email = excluded.email,
        name  = excluded.name;

  -- ── Analyses: utilizador 1 (2 analyses) ─────────────────────────────
  insert into public.analyses (owner_id, title, analysis_date, source, status)
  values (v_user_1, 'Recolha Matinal', current_date, 'manual', 'active')
  returning id into v_analysis_1;

  insert into public.analyses (owner_id, title, analysis_date, source, status)
  values (v_user_1, 'Sessao Equipamento', current_date - 1, 'device', 'active')
  returning id into v_analysis_2;

  -- ── Analyses: utilizador 2 (1 analysis, para testes de ownership) ──
  insert into public.analyses (owner_id, title, analysis_date, source, status)
  values (v_user_2, 'Recolha Teste Isolamento', current_date, 'manual', 'active')
  returning id into v_analysis_3;

  -- ── Marcar analysis 1 como activa para utilizador 1 ─────────────────
  update public.profiles
  set active_analysis_id = v_analysis_1
  where id = v_user_1;

  -- ── Medições: urina ×4 (analysis 1) ────────────────────────────────
  insert into public.analysis_measurements
    (analysis_id, category, metric_key, label, value_numeric, value_text, unit, status, measured_at, display_order)
  values
    (v_analysis_1, 'urina', 'ph', 'pH Urinário', 6.5, null, 'pH', 'active', now(), 1),
    (v_analysis_1, 'urina', 'nitritos', 'Nitritos', null, 'negativo', null, 'active', now(), 2),
    (v_analysis_1, 'urina', 'glicose', 'Glicose', 0, 'negativo', 'mg/dL', 'active', now(), 3),
    (v_analysis_1, 'urina', 'creatinina', 'Creatinina', 120, null, 'mg/dL', 'active', now(), 4);

  -- ── Medições: fisiologica ×3 (analysis 1) ──────────────────────────
  insert into public.analysis_measurements
    (analysis_id, category, metric_key, label, value_numeric, unit, status, measured_at, display_order)
  values
    (v_analysis_1, 'fisiologica', 'peso', 'Peso Corporal', 72.5, 'kg', 'active', now(), 5),
    (v_analysis_1, 'fisiologica', 'temperatura', 'Temperatura', 36.4, '°C', 'active', now(), 6),
    (v_analysis_1, 'fisiologica', 'frequencia_cardiaca', 'Frequência Cardíaca', 68, 'bpm', 'active', now(), 7);

  -- ── Medições: fecal ×1 (analysis 1) ────────────────────────────────
  insert into public.analysis_measurements
    (analysis_id, category, metric_key, label, value_numeric, value_text, unit, status, measured_at, display_order, payload)
  values
    (v_analysis_1, 'fecal', 'bristol_scale', 'Escala de Bristol', 4, 'Tipo 4', null, 'active', now(), 8,
     '{"descricao": "Forma de salsicha, lisa e macia"}'::jsonb);

  -- ── Medições: ecossistema ×1 (analysis 1) ──────────────────────────
  insert into public.analysis_measurements
    (analysis_id, category, metric_key, label, value_numeric, value_text, unit, status, measured_at, display_order, source_details)
  values
    (v_analysis_1, 'ecossistema', 'hydration_context', 'Contexto Hidratação', 2.1, '2.1 L', 'L', 'active', now(), 9,
     '{"origem": "apple_health", "data_sync": "2026-04-08"}'::jsonb);

  -- ── Evento (analysis 1) ────────────────────────────────────────────
  insert into public.analysis_events
    (analysis_id, event_type, occurred_at, payload)
  values
    (v_analysis_1, 'hydration_logged', now() - interval '2 hours',
     '{"valor": "2.1 L", "origem": "apple_health"}'::jsonb);

  -- ── Insight (analysis 1) ───────────────────────────────────────────
  insert into public.analysis_insights
    (analysis_id, provider, model, prompt_version, language, status, summary_text, output_json)
  values
    (v_analysis_1, 'openai', 'gpt-4o', '1.0.0', 'pt', 'ready',
     'Os marcadores urinários estão dentro dos valores normais. Hidratação adequada.',
     '{"seccoes": [{"titulo": "Hidratação", "corpo": "pH e creatinina normais indicam boa hidratação."}]}'::jsonb);

  raise notice 'Seed concluído. user_1=%, user_2=%, analysis_1=%, analysis_2=%, analysis_3=%',
    v_user_1, v_user_2, v_analysis_1, v_analysis_2, v_analysis_3;

end;
$$;

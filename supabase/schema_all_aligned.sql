create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_auth_user_changed()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set email      = excluded.email,
        name       = excluded.name,
        updated_at = now();
  return new;
end;
$$;

create or replace function public.ensure_profile_active_analysis_belongs_to_owner()
returns trigger
language plpgsql
as $$
begin
  if new.active_analysis_id is not null then
    if not exists (
      select 1
      from public.analyses a
      where a.id = new.active_analysis_id
        and a.owner_id = new.id
    ) then
      raise exception 'active_analysis_id não pertence ao utilizador %', new.id;
    end if;
  end if;
  return new;
end;
$$;

create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              text not null,
  name               text,
  active_analysis_id uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.analyses (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  title         text,
  analysis_date date not null default current_date,
  source        text not null default 'manual',
  status        text not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles
  add constraint fk_profiles_active_analysis
  foreign key (active_analysis_id)
  references public.analyses (id)
  on delete set null;

create table if not exists public.analysis_measurements (
  id             uuid primary key default gen_random_uuid(),
  analysis_id    uuid not null references public.analyses (id) on delete cascade,
  category       text not null,
  metric_key     text not null,
  label          text,
  value_numeric  numeric,
  value_text     text,
  value_boolean  boolean,
  unit           text,
  status         text not null default 'active',
  measured_at    timestamptz not null default now(),
  display_order  integer not null default 0,
  payload        jsonb,
  source_details jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.analysis_events (
  id          uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  event_type  text not null,
  occurred_at timestamptz not null default now(),
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.analysis_insights (
  id              uuid primary key default gen_random_uuid(),
  analysis_id     uuid not null references public.analyses (id) on delete cascade,
  provider        text not null,
  model           text not null,
  prompt_version  text not null,
  language        text not null default 'pt',
  status          text not null default 'pending',
  summary_text    text,
  output_json     jsonb,
  error_text      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_profiles_active_analysis_id
  on public.profiles (active_analysis_id);

create index if not exists idx_analyses_owner_id
  on public.analyses (owner_id);

create index if not exists idx_analyses_owner_id_date_desc
  on public.analyses (owner_id, analysis_date desc);

create index if not exists idx_analysis_measurements_analysis_id
  on public.analysis_measurements (analysis_id);

create index if not exists idx_analysis_measurements_analysis_id_category
  on public.analysis_measurements (analysis_id, category);

create index if not exists idx_analysis_events_analysis_id
  on public.analysis_events (analysis_id);

create index if not exists idx_analysis_events_analysis_id_occurred_at_desc
  on public.analysis_events (analysis_id, occurred_at desc);

create index if not exists idx_analysis_insights_analysis_id
  on public.analysis_insights (analysis_id);

create index if not exists idx_analysis_insights_analysis_id_created_at_desc
  on public.analysis_insights (analysis_id, created_at desc);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger trg_analyses_updated_at
  before update on public.analyses
  for each row
  execute function public.set_updated_at();

create trigger trg_analysis_measurements_updated_at
  before update on public.analysis_measurements
  for each row
  execute function public.set_updated_at();

create trigger trg_analysis_insights_updated_at
  before update on public.analysis_insights
  for each row
  execute function public.set_updated_at();

create trigger trg_profiles_validate_active_analysis
  before insert or update of active_analysis_id on public.profiles
  for each row
  execute function public.ensure_profile_active_analysis_belongs_to_owner();

create trigger trg_auth_users_on_insert
  after insert on auth.users
  for each row
  execute function public.handle_auth_user_changed();

create trigger trg_auth_users_on_update
  after update of email, raw_user_meta_data on auth.users
  for each row
  execute function public.handle_auth_user_changed();

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_measurements enable row level security;
alter table public.analysis_events enable row level security;
alter table public.analysis_insights enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists analyses_select_own on public.analyses;
create policy analyses_select_own
  on public.analyses
  for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists analyses_insert_own on public.analyses;
create policy analyses_insert_own
  on public.analyses
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists analyses_update_own on public.analyses;
create policy analyses_update_own
  on public.analyses
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists analyses_delete_own on public.analyses;
create policy analyses_delete_own
  on public.analyses
  for delete
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists analysis_measurements_select_own on public.analysis_measurements;
create policy analysis_measurements_select_own
  on public.analysis_measurements
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_measurements.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

drop policy if exists analysis_measurements_insert_own on public.analysis_measurements;
create policy analysis_measurements_insert_own
  on public.analysis_measurements
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_measurements.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

drop policy if exists analysis_measurements_update_own on public.analysis_measurements;
create policy analysis_measurements_update_own
  on public.analysis_measurements
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_measurements.analysis_id
        and analyses.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_measurements.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

drop policy if exists analysis_measurements_delete_own on public.analysis_measurements;
create policy analysis_measurements_delete_own
  on public.analysis_measurements
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_measurements.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

drop policy if exists analysis_events_select_own on public.analysis_events;
create policy analysis_events_select_own
  on public.analysis_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_events.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

drop policy if exists analysis_events_insert_own on public.analysis_events;
create policy analysis_events_insert_own
  on public.analysis_events
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_events.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

drop policy if exists analysis_events_update_own on public.analysis_events;
create policy analysis_events_update_own
  on public.analysis_events
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_events.analysis_id
        and analyses.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_events.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

drop policy if exists analysis_events_delete_own on public.analysis_events;
create policy analysis_events_delete_own
  on public.analysis_events
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_events.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

drop policy if exists analysis_insights_select_own on public.analysis_insights;
create policy analysis_insights_select_own
  on public.analysis_insights
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_insights.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

drop policy if exists analysis_insights_insert_own on public.analysis_insights;
create policy analysis_insights_insert_own
  on public.analysis_insights
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_insights.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

drop policy if exists analysis_insights_update_own on public.analysis_insights;
create policy analysis_insights_update_own
  on public.analysis_insights
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_insights.analysis_id
        and analyses.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_insights.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

drop policy if exists analysis_insights_delete_own on public.analysis_insights;
create policy analysis_insights_delete_own
  on public.analysis_insights
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.analyses
      where analyses.id = analysis_insights.analysis_id
        and analyses.owner_id = auth.uid()
    )
  );

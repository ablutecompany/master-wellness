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

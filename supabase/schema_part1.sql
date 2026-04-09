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
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set email        = excluded.email,
        display_name = excluded.display_name,
        updated_at   = now();
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
        and a.profile_id = new.id
    ) then
      raise exception 'active_analysis_id não pertence ao utilizador %', new.id;
    end if;
  end if;
  return new;
end;
$$;

create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text not null,
  display_name     text,
  avatar_url       text,
  date_of_birth    date,
  sex              text check (sex in ('M', 'F', 'O')),
  language         text not null default 'pt-PT',
  country          text,
  timezone         text,
  goals            text[] not null default '{}',
  habits           text[] not null default '{}',
  age              integer,
  weight           numeric(5,2),
  height           numeric(5,2),
  credits          integer not null default 0,
  onboarding_done  boolean not null default false,
  active_analysis_id uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.analyses (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references public.profiles (id) on delete cascade,
  label              text,
  analysis_date      date not null default current_date,
  source             text not null default 'manual' check (source in ('device', 'manual', 'demo')),
  demo_scenario_key  text,
  status             text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.profiles
  add constraint fk_profiles_active_analysis
  foreign key (active_analysis_id)
  references public.analyses (id)
  on delete set null;

create table if not exists public.analysis_measurements (
  id            uuid primary key default gen_random_uuid(),
  analysis_id   uuid not null references public.analyses (id) on delete cascade,
  type          text not null check (type in ('urinalysis', 'ecg', 'ppg', 'temp', 'weight', 'fecal')),
  marker        text,
  value         text not null,
  unit          text not null,
  recorded_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create table if not exists public.analysis_events (
  id             uuid primary key default gen_random_uuid(),
  analysis_id    uuid not null references public.analyses (id) on delete cascade,
  type           text not null,
  value          text not null,
  source_app_id  text,
  recorded_at    timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

create table if not exists public.analysis_insights (
  id             uuid primary key default gen_random_uuid(),
  analysis_id    uuid not null references public.analyses (id) on delete cascade,
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  turn           integer not null default 1 check (turn in (1, 2)),
  payload        jsonb not null default '{}',
  model_used     text,
  tokens_used    integer,
  exec_millis    integer,
  status         text not null default 'pending' check (status in ('pending', 'generating', 'ready', 'failed')),
  error_message  text,
  generated_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

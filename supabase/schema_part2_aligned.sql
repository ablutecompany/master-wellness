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

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

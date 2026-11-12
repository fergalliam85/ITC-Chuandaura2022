create table if not exists public.study_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null default '{"learned":[],"saved":[],"recent":[],"practicalHistory":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.study_progress enable row level security;

grant select, insert, update on public.study_progress to authenticated;

drop policy if exists "Users can read their own progress" on public.study_progress;
create policy "Users can read their own progress"
  on public.study_progress for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own progress" on public.study_progress;
create policy "Users can insert their own progress"
  on public.study_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own progress" on public.study_progress;
create policy "Users can update their own progress"
  on public.study_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

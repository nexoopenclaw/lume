-- Lume cloud sync schema (run in Supabase SQL editor)

create table if not exists public.lume_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lume_state enable row level security;

drop policy if exists "own lume state select" on public.lume_state;
drop policy if exists "own lume state upsert" on public.lume_state;

create policy "own lume state select"
on public.lume_state
for select
using (auth.uid() = user_id);

create policy "own lume state upsert"
on public.lume_state
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

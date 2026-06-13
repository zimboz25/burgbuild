-- Run this in the Supabase SQL editor (Dashboard → SQL → New query)
-- or via Supabase CLI: supabase db push

create table if not exists public.builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My Build',
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists builds_user_id_idx on public.builds (user_id);
create index if not exists builds_updated_at_idx on public.builds (updated_at desc);

alter table public.builds enable row level security;

create policy "Users can view own builds"
  on public.builds
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own builds"
  on public.builds
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own builds"
  on public.builds
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own builds"
  on public.builds
  for delete
  using (auth.uid() = user_id);

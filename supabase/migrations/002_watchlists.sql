create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  market_id text not null,
  symbol text not null,
  added_at timestamptz not null default now(),
  added_price numeric,
  notes text,
  unique (user_id, market_id, symbol)
);

create index if not exists watchlists_user_id_idx on public.watchlists (user_id);
create index if not exists watchlists_added_at_idx on public.watchlists (added_at desc);

alter table public.watchlists enable row level security;

create policy "Users can view own watchlist"
  on public.watchlists
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own watchlist"
  on public.watchlists
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own watchlist"
  on public.watchlists
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own watchlist"
  on public.watchlists
  for delete
  using (auth.uid() = user_id);

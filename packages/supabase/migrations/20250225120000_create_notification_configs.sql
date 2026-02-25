-- Notification configs per user (wallet) and chain for Aave health factor alerts.
-- Used by packages/nextjs (notification_configs service).

create table if not exists public.notification_configs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  chain_id integer not null,
  enabled boolean not null default true,
  services text[] not null default '{}',
  health_factor_threshold numeric not null default 1,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, chain_id)
);

-- Index for lookups by user_id and chain_id
create index if not exists idx_notification_configs_user_chain
  on public.notification_configs (user_id, chain_id);

-- Allow anon and authenticated to use the table (for local dev and optional RLS later)
alter table public.notification_configs enable row level security;

create policy "Allow anon read/write for local dev"
  on public.notification_configs
  for all
  to anon
  using (true)
  with check (true);

create policy "Allow authenticated read/write"
  on public.notification_configs
  for all
  to authenticated
  using (true)
  with check (true);

-- Optional: keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_notification_configs_updated_at
  before update on public.notification_configs
  for each row
  execute function public.set_updated_at();

comment on table public.notification_configs is 'Per-wallet, per-chain notification settings for Aave health factor alerts.';

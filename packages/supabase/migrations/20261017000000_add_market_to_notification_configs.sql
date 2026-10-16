-- One chain can hold several Aave markets, each with its own position and health factor: Ethereum has four V3 Pools
-- (Core, Prime, EtherFi, Horizon), and Aave V4 keeps a separate position in every Spoke. `market` says which market
-- an alert is for: 'v3' for the chain's main V3 market (its only one before October 2026), or the lowercased address
-- of a V3 Pool or a V4 Spoke. Written by PUT /api/notifications/config (optional `market`, 'v3' when absent) and read
-- by the notification cron, which reads the health factor from that Pool or Spoke.
-- Existing rows get 'v3', the only market there was. The unique key grows from (user_id, chain_id) to
-- (user_id, chain_id, market).
-- Idempotent: the column is added only if missing, and the constraints and the index are dropped and recreated.

alter table public.notification_configs
  add column if not exists market text not null default 'v3';

alter table public.notification_configs
  drop constraint if exists notification_configs_market_check;

alter table public.notification_configs
  add constraint notification_configs_market_check check (market = 'v3' or market ~ '^0x[0-9a-f]{40}$');

-- The name Postgres gave the inline unique (user_id, chain_id) of the create migration.
alter table public.notification_configs
  drop constraint if exists notification_configs_user_id_chain_id_key;

alter table public.notification_configs
  drop constraint if exists notification_configs_user_id_chain_id_market_key;

alter table public.notification_configs
  add constraint notification_configs_user_id_chain_id_market_key unique (user_id, chain_id, market);

-- The new unique constraint's index covers lookups by (user_id, chain_id) too.
drop index if exists public.idx_notification_configs_user_chain;

comment on column public.notification_configs.market is 'Aave market the alert is for: v3 (the chain''s main V3 market) or the lowercased address of a V3 Pool or V4 Spoke.';

comment on table public.notification_configs is 'Per-wallet, per-market notification settings for Aave health factor alerts.';

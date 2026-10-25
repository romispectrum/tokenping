-- Alerts for Morpho borrowers beside Aave's. `protocol` says which lending protocol an alert watches:
--
--   aave             every row before this migration: `market` is 'v3' or a V3 Pool's or V4 Spoke's address.
--   morpho-blue      Morpho's variable-rate markets: `market` is the market id, a lowercased bytes32.
--   morpho-midnight  Morpho's fixed-rate, fixed-term markets: `market` is the market id, a lowercased bytes32.
--
-- `market_params` holds what a Morpho alert needs to read its position and never changes once the market exists
-- (tokens, oracles, LLTVs, a Midnight market's maturity, a Blue market's pre-liquidation contracts). PUT
-- /api/notifications/config reads it from the chain when the alert is saved; the cron then reads only the position
-- and the prices. Null for Aave.
--
-- The unique key (user_id, chain_id, market) stays: an Aave market id (40 hex characters or 'v3') can never equal a
-- Morpho one (64), and Blue and Midnight ids are hashes of different structures.
--
-- notification_maturity_reminders records the reminders sent before a Midnight market matures, one row per alert,
-- kind and maturity, so each goes out once. The cron inserts the row before it sends (ignoring a duplicate, which means
-- another run took it) and deletes it again when every channel failed, so the next run tries again.
--
-- Idempotent: columns, table and policies are created only if missing, and the checks are dropped and recreated.

alter table public.notification_configs
  add column if not exists protocol text not null default 'aave';

alter table public.notification_configs
  add column if not exists market_params jsonb;

alter table public.notification_configs
  drop constraint if exists notification_configs_protocol_check;

alter table public.notification_configs
  add constraint notification_configs_protocol_check
  check (protocol in ('aave', 'morpho-blue', 'morpho-midnight'));

alter table public.notification_configs
  drop constraint if exists notification_configs_market_check;

alter table public.notification_configs
  add constraint notification_configs_market_check check (
    case protocol
      when 'aave' then market = 'v3' or market ~ '^0x[0-9a-f]{40}$'
      else market ~ '^0x[0-9a-f]{64}$'
    end
  );

alter table public.notification_configs
  drop constraint if exists notification_configs_market_params_check;

-- coalesce: jsonb_typeof(null) is null, and a check that comes out null passes, which would let a Morpho row in
-- without its parameters.
alter table public.notification_configs
  add constraint notification_configs_market_params_check check (
    (protocol = 'aave' and market_params is null)
    or (protocol <> 'aave' and coalesce(jsonb_typeof(market_params), '') = 'object')
  );

comment on column public.notification_configs.protocol is 'Lending protocol the alert watches: aave, morpho-blue or morpho-midnight.';

comment on column public.notification_configs.market is 'Market the alert is for. Aave: v3 (the chain''s main V3 market) or the lowercased address of a V3 Pool or V4 Spoke. Morpho: the lowercased market id (bytes32).';

comment on column public.notification_configs.market_params is 'Morpho only: the market''s fixed parameters (tokens, oracles, LLTVs, maturity, pre-liquidation contracts), read from the chain when the alert is saved.';

comment on table public.notification_configs is 'Per-wallet, per-market notification settings for Aave and Morpho health factor alerts.';

create table if not exists public.notification_maturity_reminders (
  config_id uuid not null references public.notification_configs (id) on delete cascade,
  kind      text not null check (kind in ('7d', '1d')),
  maturity  timestamptz not null,
  sent_at   timestamptz not null default now(),
  primary key (config_id, kind, maturity)
);

comment on table public.notification_maturity_reminders is
  'Reminders sent before a Morpho Midnight market matures: one per alert, kind (7 days or 1 day before) and maturity. Service role only.';

-- Server-only like the other tables: RLS on with no policies, and the default grants of anon and authenticated revoked.
alter table public.notification_maturity_reminders enable row level security;

revoke all on public.notification_maturity_reminders from anon, authenticated;

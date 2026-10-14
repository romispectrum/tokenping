-- Telegram notification channel.
--
-- Design notes:
-- 1. `user_telegram_links` stores the chat_id at the USER level (not per chain).
--    A Telegram account is a per-user identity; forcing re-link per chain would be
--    hostile UX. The cron joins this table to deliver to all of a user's configs.
-- 2. `telegram_link_tokens` stores one-shot, time-limited tokens emitted when the
--    user clicks "Connect Telegram". The webhook consumes them atomically via
--    UPDATE ... WHERE consumed_at IS NULL AND expires_at > now() RETURNING.
-- 3. We do NOT add a `telegram_chat_id` column to `notification_configs` — instead
--    the existing `services` array gains a "telegram" entry and delivery is joined
--    against `user_telegram_links` at cron time.

----------------------------------------------------------------------
-- Per-user Telegram link
----------------------------------------------------------------------
create table if not exists public.user_telegram_links (
  user_id     text primary key,             -- normalized wallet address (lowercase)
  chat_id     text not null,                -- Telegram chat.id as text (may exceed JS safe int)
  username    text,                          -- cosmetic; refreshed on each webhook hit
  linked_at   timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- For /stop and bot-blocked cleanup: find link by chat_id
create unique index if not exists user_telegram_links_chat_id_idx
  on public.user_telegram_links (chat_id);

comment on table public.user_telegram_links is
  'Maps a wallet (user_id) to a Telegram chat_id. One row per user; chat_id unique.';

----------------------------------------------------------------------
-- Short-lived link tokens (deep-link handshake)
----------------------------------------------------------------------
create table if not exists public.telegram_link_tokens (
  token       text primary key,              -- crypto.randomBytes(32).toString('base64url'), <=64 chars (Telegram limit)
  user_id     text not null,                  -- normalized wallet address
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,           -- typically now() + interval '10 minutes'
  consumed_at timestamptz                     -- non-null after webhook consumes it
);

create index if not exists telegram_link_tokens_user_idx
  on public.telegram_link_tokens (user_id);

-- Quick cleanup of expired unconsumed tokens
create index if not exists telegram_link_tokens_expires_idx
  on public.telegram_link_tokens (expires_at)
  where consumed_at is null;

comment on table public.telegram_link_tokens is
  'One-shot, time-limited deep-link tokens for "Connect Telegram" handshake. Consumed atomically by the webhook.';

----------------------------------------------------------------------
-- RLS — these are server-only tables (service role bypasses RLS).
-- Lock down anon/authenticated since tokens are bearer credentials.
----------------------------------------------------------------------
alter table public.user_telegram_links enable row level security;
alter table public.telegram_link_tokens enable row level security;

-- Match the existing notification_configs policy style (allow for local dev).
-- Production hardening (move to SIWE-authenticated access) is tracked separately.
create policy "Allow anon read/write for local dev"
  on public.user_telegram_links
  for all
  to anon
  using (true)
  with check (true);

create policy "Allow authenticated read/write"
  on public.user_telegram_links
  for all
  to authenticated
  using (true)
  with check (true);

-- telegram_link_tokens: NO anon/authenticated access. Service role only.
-- Tokens are bearer credentials — never expose them via the anon key.
revoke all on public.telegram_link_tokens from anon, authenticated;

----------------------------------------------------------------------
-- Keep updated_at in sync on user_telegram_links
----------------------------------------------------------------------
create trigger set_user_telegram_links_updated_at
  before update on public.user_telegram_links
  for each row
  execute function public.set_updated_at();

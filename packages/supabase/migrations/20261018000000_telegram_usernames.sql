-- Telegram by username. An alert names the Telegram account it goes to, as it names a Signal username; the bot learns
-- which chat belongs to which username when that person sends it /start. That replaces the wallet-bound deep-link
-- handshake: telegram_link_tokens and user_telegram_links are migrated, then dropped.
--
--   telegram_chats: one row per chat that has pressed Start: its chat id and the username it had then (lowercased).
--                   Written by the webhook on /start, deleted on /stop and when Telegram reports the chat gone.
--   notification_configs.telegram_username: the account an alert's Telegram messages go to (lowercased, no "@").
--
-- A Telegram username is 4 to 32 letters, digits and underscores, starts with a letter and does not end with an
-- underscore (4-character names exist as collectibles). Stored lowercased: Telegram usernames are case-insensitive.
-- Idempotent: tables and columns are created only if missing, constraints and policies are dropped and recreated,
-- and the copy from the old tables runs only while they still exist.

create table if not exists public.telegram_chats (
  chat_id    text primary key,
  username   text not null,
  linked_at  timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.telegram_chats drop constraint if exists telegram_chats_username_key;
alter table public.telegram_chats add constraint telegram_chats_username_key unique (username);

alter table public.telegram_chats drop constraint if exists telegram_chats_username_check;
alter table public.telegram_chats
  add constraint telegram_chats_username_check check (username ~ '^[a-z][a-z0-9_]{2,30}[a-z0-9]$');

-- Server-only like notification_configs: anon/authenticated policies for local dev, the service role in production.
alter table public.telegram_chats enable row level security;

drop policy if exists "Allow anon read/write for local dev" on public.telegram_chats;
create policy "Allow anon read/write for local dev"
  on public.telegram_chats
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "Allow authenticated read/write" on public.telegram_chats;
create policy "Allow authenticated read/write"
  on public.telegram_chats
  for all
  to authenticated
  using (true)
  with check (true);

drop trigger if exists set_telegram_chats_updated_at on public.telegram_chats;
create trigger set_telegram_chats_updated_at
  before update on public.telegram_chats
  for each row
  execute function public.set_updated_at();

alter table public.notification_configs
  add column if not exists telegram_username text;

alter table public.notification_configs
  drop constraint if exists notification_configs_telegram_username_check;

alter table public.notification_configs
  add constraint notification_configs_telegram_username_check
  check (telegram_username is null or telegram_username ~ '^[a-z][a-z0-9_]{2,30}[a-z0-9]$');

-- Carry the wallet-bound links over: a linked chat with a username becomes a telegram_chats row, and that wallet's
-- alerts with Telegram selected name the username. A link without a username cannot be carried over; its owner sets
-- a username in Telegram and types it into the alert. The old tables go afterwards.
do $$
begin
  if to_regclass('public.user_telegram_links') is not null then
    insert into public.telegram_chats (chat_id, username, linked_at)
    select distinct on (lower(l.username)) l.chat_id, lower(l.username), l.linked_at
    from public.user_telegram_links l
    where l.username is not null and lower(l.username) ~ '^[a-z][a-z0-9_]{2,30}[a-z0-9]$'
    order by lower(l.username), l.linked_at desc
    on conflict do nothing;

    update public.notification_configs c
    set telegram_username = lower(l.username)
    from public.user_telegram_links l
    where lower(c.user_id) = lower(l.user_id)
      and 'telegram' = any(c.services)
      and c.telegram_username is null
      and l.username is not null
      and lower(l.username) ~ '^[a-z][a-z0-9_]{2,30}[a-z0-9]$';
  end if;
end $$;

drop table if exists public.telegram_link_tokens;
drop table if exists public.user_telegram_links;

comment on table public.telegram_chats is 'Telegram chats that pressed Start in the bot, by username (lowercased).';
comment on column public.notification_configs.telegram_username is 'Telegram username the alert goes to, lowercased, without @.';

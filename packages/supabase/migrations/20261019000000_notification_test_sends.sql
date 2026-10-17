-- Test messages: an alert's summary has a "Send test" button per channel (email, Signal, Telegram) that sends the
-- alert and the position as they are right now, so people can check a channel works. One test per wallet and
-- channel every 15 minutes, enforced here rather than only in the browser.
--
--   notification_test_sends: the last test per (wallet, channel). Read by GET /api/notifications/test to show when
--                            each button can be used again; written by claim_notification_test_send.
--   claim_notification_test_send(user, channel, cooldown): takes the slot in one statement, so two clicks or two
--                            tabs can never both send. Returns whether it was taken and when the next one is allowed.
--
-- POST /api/notifications/test claims first and sends afterwards; when the send fails it deletes the row it claimed
-- (matched by its sent_at), so a broken channel can be tried again at once.
-- Idempotent: the table is created only if missing, the function is replaced, and the policies are recreated.

create table if not exists public.notification_test_sends (
  user_id text not null,
  channel text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, channel)
);

alter table public.notification_test_sends drop constraint if exists notification_test_sends_channel_check;
alter table public.notification_test_sends
  add constraint notification_test_sends_channel_check check (channel in ('email', 'signal', 'telegram'));

-- Server-only like notification_configs: anon/authenticated policies for local dev, the service role in production.
alter table public.notification_test_sends enable row level security;

drop policy if exists "Allow anon read/write for local dev" on public.notification_test_sends;
create policy "Allow anon read/write for local dev"
  on public.notification_test_sends
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "Allow authenticated read/write" on public.notification_test_sends;
create policy "Allow authenticated read/write"
  on public.notification_test_sends
  for all
  to authenticated
  using (true)
  with check (true);

-- The insert takes the row lock: a second call for the same (user, channel) waits, then finds the fresh sent_at and
-- the update's condition false, so it returns no row and reports the slot taken.
create or replace function public.claim_notification_test_send(
  p_user_id text,
  p_channel text,
  p_cooldown_seconds integer
)
returns table (claimed boolean, sent_at timestamptz, retry_at timestamptz)
language plpgsql
as $$
declare
  v_cooldown interval := make_interval(secs => p_cooldown_seconds);
  v_sent_at timestamptz;
begin
  insert into public.notification_test_sends as t (user_id, channel, sent_at)
  values (p_user_id, p_channel, now())
  on conflict (user_id, channel) do update
    set sent_at = excluded.sent_at
    where t.sent_at <= now() - v_cooldown
  returning t.sent_at into v_sent_at;

  if v_sent_at is not null then
    return query select true, v_sent_at, v_sent_at + v_cooldown;
  else
    return query
      select false, t.sent_at, t.sent_at + v_cooldown
      from public.notification_test_sends t
      where t.user_id = p_user_id and t.channel = p_channel;
  end if;
end;
$$;

grant execute on function public.claim_notification_test_send(text, text, integer) to anon, authenticated, service_role;

comment on table public.notification_test_sends is 'Last test message per wallet and channel, for the one-per-15-minutes limit.';

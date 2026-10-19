-- Sign-in with Ethereum nonces. The alert API acts only for a wallet that has signed in: the browser asks
-- POST /api/auth/nonce for a nonce, the wallet signs an EIP-4361 message carrying it, and POST /api/auth/verify takes
-- the nonce (one DELETE ... RETURNING, so it works once) before it checks the signature and sets the session cookie.
--
--   nonce:      32 hex characters, random (packages/nextjs/services/auth/nonceStore.ts).
--   expires_at: five minutes after issue. Expired rows can never be taken; each new nonce sweeps them.
--
-- Server-only like user_attribution: RLS on with no policies, and the default grants of anon and authenticated
-- revoked, so only the service role (the Next.js server) reads or writes it.
-- Idempotent: the table and index are created only if missing.

create table if not exists public.auth_nonces (
  nonce       text primary key check (nonce ~ '^[0-9a-f]{32}$'),
  expires_at  timestamptz not null
);

create index if not exists auth_nonces_expires_at_idx on public.auth_nonces (expires_at);

comment on table public.auth_nonces is
  'Sign-in with Ethereum nonces: each is taken once by POST /api/auth/verify, within five minutes. Service role only.';

alter table public.auth_nonces enable row level security;

revoke all on public.auth_nonces from anon, authenticated;

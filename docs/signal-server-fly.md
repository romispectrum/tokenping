# Deploying Signal Server to Fly.io

This guide runs [signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) on Fly.io: a
persistent Docker container that Tokenping's Vercel functions (the cron at `/api/cron/notifications` and the
"Send test" route) call to send Signal notifications.

signal-cli-rest-api has no authentication of its own. Anyone who can reach it can send as the linked account,
read its incoming messages (`/v1/receive`), see its number (`/v1/accounts`) and link new devices. So the image
puts a [Caddy](https://caddyserver.com/) reverse proxy in front of it that requires a shared token on every
request.

---

## How the relay is built

Everything lives in `packages/tokenping-signal`:

| File | Purpose |
|---|---|
| `Dockerfile` | `bbernhard/signal-cli-rest-api:0.101` plus the Caddy binary, copied from the official `caddy` image |
| `Caddyfile` | Listens on 8080 and forwards to signal-cli-rest-api on 8081 |
| `entrypoint.sh` | Checks the token, starts signal-cli-rest-api and Caddy |
| `fly.toml` | Fly app `tokenping-signal`, volume, health check |

How a request is handled:

- Fly routes public HTTPS traffic to port 8080, which is Caddy.
- Every route needs `Authorization: Bearer <SIGNAL_API_TOKEN>`. A missing or wrong token gets `401`.
- `GET /v1/health` is the one exception, so the Fly health check in `fly.toml` keeps working. It only ever
  reaches the health route and answers `204`.
- Caddy drops the `Authorization` header before forwarding, and does not log requests.

How the container starts:

- `entrypoint.sh` refuses to start unless `SIGNAL_API_TOKEN` is at least 32 characters of `A-Z a-z 0-9 . _ ~ + / = -`
  (`openssl rand -hex 32` gives 64 hex characters). It also refuses any `MODE` other than `normal` or `native`.
- It starts as root, hands the volume at `/home/.local/share/signal-cli` to the `signal-api` user, then drops to
  that user with no capabilities and runs both processes. If either one stops, the container exits so Fly
  restarts it.
- Since 0.101 the upstream image starts through s6-overlay's `/init`, which refuses to run unless it is PID 1.
  On Fly, PID 1 is Fly's own init, so the image would crash with `s6-overlay-suexec: fatal: can only run as pid 1`.
  That is why `entrypoint.sh` starts the processes itself and the tag is pinned instead of `latest`.

Known limit: signal-cli-rest-api cannot be told to listen on loopback only, so port 8081 is open on the
machine's private network address. Fly does not route the internet to it, but other machines in the same Fly
organization can reach it without the token.

**Upgrading signal-cli-rest-api:** do this every couple of months. Signal's servers change often and signal-cli
releases older than about three months can stop working (linking is usually the first thing to fail). Bump the tag
in `Dockerfile` to the newest of the [releases](https://github.com/bbernhard/signal-cli-rest-api/releases), then
build and run it locally (see
[Test the image locally](#test-the-image-locally)). Check that the image still ships `signal-cli-rest-api` on
the `PATH` and reads `PORT`.

---

## Prerequisites

- [flyctl](https://fly.io/docs/hands-on/install-flyctl/) installed
- A Fly.io account (`fly auth login`)
- Docker installed locally (only needed to test the image; Fly builds it remotely)

---

## 1. fly.toml

`packages/tokenping-signal/fly.toml` is ready to use. The parts that matter:

- `[env] MODE = 'normal'`: each request starts signal-cli, reads the account from disk, sends and exits. That is
  enough for a cron every 5 minutes. The json-rpc modes need a daemon this image does not start.
- `[[mounts]]`: the `signal_data` volume at `/home/.local/share/signal-cli`, where signal-cli keeps its keys and
  session. Without it the account is lost on every restart.
- `[http_service] internal_port = 8080`: Caddy, not signal-cli-rest-api.
- `auto_stop_machines = 'off'`: keeps the machine running.
- The health check calls `GET /v1/health`, the one route that needs no token.

`SIGNAL_API_TOKEN` is a Fly secret, never an `[env]` value.

---

## 2. Create the token

Generate one token and keep it in your shell for the next steps. The same value goes into Fly and Vercel.

```bash
SIGNAL_API_TOKEN=$(openssl rand -hex 32)
```

Fly secrets cannot be read back, so copy it into Vercel (step 5) before you close the terminal. Anyone with
the token can send as the linked account and read its messages, so treat it like a password.

---

## 3. Launch and deploy

Run these from `packages/tokenping-signal`.

**First launch of a new app:**

```bash
fly launch --no-deploy    # generates app config, skips first deploy

fly volumes create signal_data --region iad --size 1   # create the persistent volume

fly secrets set --stage SIGNAL_API_TOKEN="$SIGNAL_API_TOKEN"   # store it without deploying yet

fly deploy
```

**Existing app (adding the proxy to `tokenping-signal`):** set the secret first, or the new image refuses to
start.

```bash
fly secrets set --stage SIGNAL_API_TOKEN="$SIGNAL_API_TOKEN"
fly deploy
```

The app URL is:
```
https://tokenping-signal.fly.dev
```

**Rotating the token:** generate a new one, run `fly secrets set SIGNAL_API_TOKEN=...` (this restarts the
machine), then update `SIGNAL_API_TOKEN` in Vercel and redeploy Vercel. Signal sends fail with `401` in between.

---

## 4. Link a Signal account

signal-cli acts like Signal Desktop, linked to an existing Signal account. No extra phone number is needed.

### Link through the API (recommended)

Fetch a QR code through the proxy and scan it:

```bash
curl -fsS -H "Authorization: Bearer $SIGNAL_API_TOKEN" \
  "https://tokenping-signal.fly.dev/v1/qrcodelink?device_name=TokenpingBot" \
  -o signal-link.png

open signal-link.png    # macOS; use any image viewer elsewhere
```

**On your phone:** Signal → Settings → Linked Devices → tap **+** → scan the QR code.

Scan it right away: the link expires after a short time. If it does, fetch a new PNG. The API runs signal-cli
as `signal-api` with the right config directory, so the account lands on the mounted volume.

Then confirm the API sees the account:

```bash
curl -s -H "Authorization: Bearer $SIGNAL_API_TOKEN" https://tokenping-signal.fly.dev/v1/accounts
# → ["+420XXXXXXXXXX"]
```

If the list is still empty a minute after scanning, run `fly machine restart` and check again.

Delete `signal-link.png` afterwards.

### Link from a shell on the machine

```bash
fly ssh console

# Inside the container. --config is REQUIRED: without it, signal-cli writes to $HOME/.local/share/signal-cli,
# which is NOT the mounted volume and NOT where the REST API reads from. The account would be invisible to
# the API and wiped on the next deploy.
su signal-api -c 'signal-cli --config /home/.local/share/signal-cli link -n "TokenpingBot"'
```

This prints only a `sgnl://linkdevice?...` URI, not a QR code. Turn the URI into a QR code on your laptop, for
example with `qrencode -t ansiutf8 'sgnl://linkdevice?...'`, and scan that within about 2 minutes.

Then verify and restart:

```bash
su signal-api -c 'signal-cli --config /home/.local/share/signal-cli listAccounts'
# should list +420XXXXXXXXXX

exit
fly machine restart
```

If you ran signal-cli as root by mistake, the restart hands the files back to `signal-api`.

---

## Common pitfalls

**❌ `401` from the relay**

The token is missing or does not match. The `SIGNAL_API_TOKEN` in Vercel must be exactly the Fly secret. In
the app this shows up as `Signal API responded with 401`.

**❌ `Signal service not configured (SIGNAL_API_URL, SIGNAL_SENDER_NUMBER or SIGNAL_API_TOKEN missing)`**

One of the three variables is not set in Vercel, or Vercel was not redeployed after adding it.

**❌ The machine keeps restarting**

Check `fly logs`. `tokenping-signal: SIGNAL_API_TOKEN must be at least 32 characters ...` means the Fly secret is
missing or malformed: `fly secrets set SIGNAL_API_TOKEN="$(openssl rand -hex 32)"` (and update Vercel).
`s6-overlay-suexec: fatal: can only run as pid 1` means the `ENTRYPOINT` from `Dockerfile` is not in effect.

**❌ Account doesn't work even though linking "succeeded"**

If you see "Specified account does not exist" or "is not registered" errors from `/v2/send`, the account data
likely didn't persist. Check:

1. **Did you use `--config`?** When linking from a shell, signal-cli without `--config` writes outside the
   mounted volume at `/home/.local/share/signal-cli`. Linking through `/v1/qrcodelink` avoids this.

2. **Does the API see the account?**
   ```bash
   curl -s -H "Authorization: Bearer $SIGNAL_API_TOKEN" https://tokenping-signal.fly.dev/v1/accounts
   # must return a non-empty list
   ```

3. **Is the volume actually mounted?** `/home/.local/share/signal-cli` comes from the `[[mounts]]` section in
   fly.toml. If the volume was never created with `fly volumes create signal_data --region iad --size 1`, the
   directory lives in the container and disappears on restart.

---

## 5. Set environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `SIGNAL_API_URL` | `https://tokenping-signal.fly.dev` |
| `SIGNAL_SENDER_NUMBER` | The phone number of the linked account, in E.164 format (what `/v1/accounts` returns) |
| `SIGNAL_API_TOKEN` | The token from step 2, the same value as the Fly secret |

Redeploy Vercel after adding the vars. Tokenping sends it as `Authorization: Bearer <token>` and treats a
missing token like a missing URL or number: Signal reports "not configured" instead of calling the relay.

---

## 6. Verify it works

```bash
# Without the token every route is refused: expect 401
curl -s -o /dev/null -w '%{http_code}\n' https://tokenping-signal.fly.dev/v1/accounts

# The health check stays open: expect 204
curl -s -o /dev/null -w '%{http_code}\n' https://tokenping-signal.fly.dev/v1/health

# With the token: expect the linked number
curl -s -H "Authorization: Bearer $SIGNAL_API_TOKEN" https://tokenping-signal.fly.dev/v1/accounts

# Send a test message to yourself: replace alice.42 with your Signal username
curl -s -X POST https://tokenping-signal.fly.dev/v2/send \
  -H "Authorization: Bearer $SIGNAL_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tokenping Signal test",
    "number": "+1XXXXXXXXXX",
    "recipients": ["alice.42"]
  }'
```

You should receive the message in Signal within a few seconds. The "Send test" button next to the Signal
channel in Tokenping goes through the same path from Vercel.

---

## Test the image locally

```bash
docker build --platform linux/amd64 -t tokenping-signal packages/tokenping-signal

docker run --rm --init -e SIGNAL_API_TOKEN="$SIGNAL_API_TOKEN" -p 127.0.0.1:8080:8080 tokenping-signal
```

`--init` makes the entrypoint run as a child of another PID 1, as on Fly. Then run the curls from step 6
against `http://127.0.0.1:8080`: `/v1/accounts` gives `401` without the token and `[]` with it, and
`/v1/health` gives `204`.

---

## 7. Monitoring and troubleshooting

Fly keeps the machine running because `auto_stop_machines = 'off'` is set in fly.toml. In `normal` mode, each
send request is independent: no daemon state to manage, so restarts are safe.

**Check the account is still registered after a restart:**

```bash
fly ssh console
su signal-api -c 'signal-cli --config /home/.local/share/signal-cli listAccounts'
# should list your phone number
exit
```

**View container logs:**

```bash
fly logs
```

**If messages aren't sending:**

1. Verify the account is on the persistent volume:
   ```bash
   fly ssh console
   cat /home/.local/share/signal-cli/data/accounts.json | head -c 100
   # should be >100 bytes if account data is present; ~39 bytes means empty
   ```

2. Verify the REST API sees it:
   ```bash
   curl -s -H "Authorization: Bearer $SIGNAL_API_TOKEN" https://tokenping-signal.fly.dev/v1/accounts
   # should return a non-empty list
   ```

3. Check that `SIGNAL_SENDER_NUMBER` in Vercel is the number `/v1/accounts` returns. It is a Vercel variable;
   the relay does not know it.

4. A `401` means the Vercel `SIGNAL_API_TOKEN` and the Fly secret differ (see Common pitfalls).

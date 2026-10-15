# Deploying Signal Server to Fly.io

This guide sets up [signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api)
on Fly.io: a persistent Docker container that Tokenping's Vercel cron calls to
send Signal notifications.

---

## Prerequisites

- [flyctl](https://fly.io/docs/hands-on/install-flyctl/) installed
- A Fly.io account (`fly auth login`)
- Docker installed locally (only needed to build; Fly can remote-build too)

---

## 1. Create a project directory

```bash
mkdir tokenping-signal && cd tokenping-signal
```

---

## 2. Create the Dockerfile

```dockerfile
FROM bbernhard/signal-cli-rest-api:latest
```

That's the entire Dockerfile. The image bundles signal-cli and the REST API.

---

## 3. Create fly.toml

**MODE choice:** For Tokenping's use case (notifications every 5 minutes from Vercel cron),
`normal` mode is best: each request is independent, stateless, and fast enough. `json-rpc`
is only needed for high-volume or real-time messaging.

```toml
app = "tokenping-signal"        # change to your preferred app name
primary_region = "iad"          # pick a region close to your Vercel deployment

[build]

[env]
  MODE = "normal"               # each request spawns a fresh signal-cli process, reads account from disk, sends, exits
                                # simpler, more reliable, and sufficient for periodic cron jobs
                                # switch to "json-rpc" only if sending hundreds of messages per second

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false    # keep alive: signal-cli needs a persistent process
  auto_start_machines = true

  [[http_service.checks]]
    interval = "30s"
    timeout  = "10s"
    grace_period = "30s"
    method = "GET"
    path = "/v1/health"

[[mounts]]
  source      = "signal_data"
  destination = "/home/.local/share/signal-cli"   # signal-cli stores keys + session here
  initial_size = "1gb"
```

---

## 4. Launch and deploy

```bash
fly launch --no-deploy    # generates app config, skips first deploy

fly volumes create signal_data --region iad --size 1   # create the persistent volume

fly deploy
```

After deploy finishes, note your app URL:
```
https://tokenping-signal.fly.dev
```

---

## 5. Register a Signal account on the server

There are two options. **Option A is the easiest.**

### Option A: Link to your existing Signal account (recommended)

No extra phone number needed. signal-cli acts like Signal Desktop.

```bash
# Open a shell inside the running container
fly ssh console

# Inside the container: generate a link URI.
# --config is REQUIRED: without it, signal-cli writes to $HOME/.local/share/signal-cli
# (i.e. /root/.local/... when you're root in `fly ssh console`), which is NOT the mounted
# volume and NOT where the REST API daemon reads from. The account would be invisible to
# the API and wiped on next deploy.
signal-cli --config /home/.local/share/signal-cli link -n "TokenpingBot"
```

This prints a `sgnl://linkdevice?...` URI and a QR code in the terminal.

**On your phone:** Signal → Settings → Linked Devices → tap **+** → scan the QR code.

You have about 2 minutes before the link expires. Once linked, verify the account
landed on the mounted volume and restart so the daemon picks it up:

```bash
signal-cli --config /home/.local/share/signal-cli listAccounts
# should list +420XXXXXXXXXX

exit
fly machine restart

# From your laptop: confirm the REST API sees the account:
curl https://tokenping-signal.fly.dev/v1/accounts
# → ["+420XXXXXXXXXX"]
```

---

## Common pitfalls

**❌ Account doesn't work even though linking "succeeded"**

If you see "Specified account does not exist" errors from `/v2/send`, the account
data likely didn't persist. Check:

1. **Did you use `--config`?** Without it, `signal-cli link` writes to `/root/.local/share/signal-cli`,
   not the mounted volume at `/home/.local/share/signal-cli`. The account is invisible to
   the API and lost on next deploy. **Always use:**
   ```bash
   signal-cli --config /home/.local/share/signal-cli link -n "TokenpingBot"
   ```

2. **Did you verify and restart after linking?**
   ```bash
   signal-cli --config /home/.local/share/signal-cli listAccounts
   exit
   fly machine restart
   curl https://your-app.fly.dev/v1/accounts  # must return a non-empty list
   ```

3. **Is the volume actually mounted?** The Dockerfile is just `FROM bbernhard/signal-cli-rest-api:latest`.
   It doesn't create `/home/.local/share/signal-cli`: that comes from the `[[mounts]]` section in fly.toml.
   If you copy-pasted but didn't create the volume with `fly volumes create signal_data --region iad --size 1`,
   the container will create a temporary `/home/.local/share/signal-cli` that disappears on restart.

---

## 6. Set environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `SIGNAL_API_URL` | `https://tokenping-signal.fly.dev` |
| `SIGNAL_SENDER_NUMBER` | The phone number used in step 5 (Option A: your personal number; Option B: your Twilio number) |

Redeploy Vercel after adding the vars.

---

## 7. Verify it works

```bash
# Send a test message to yourself: replace alice.42 with your Signal username
curl -s -X POST https://tokenping-signal.fly.dev/v2/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tokenping Signal test",
    "number": "+1XXXXXXXXXX",
    "recipients": ["u:alice.42"]
  }'
```

You should receive the message in Signal within a few seconds.

---

## 8. Monitoring and troubleshooting

Fly.io keeps the machine running because `auto_stop_machines = false` is set in
fly.toml. In `normal` mode, each send request is independent: no daemon state to
manage, so restarts are safe.

**Check account is still registered after restart:**

```bash
fly ssh console
signal-cli --config /home/.local/share/signal-cli listAccounts
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

2. Verify the REST API daemon sees it:
   ```bash
   curl https://tokenping-signal.fly.dev/v1/accounts
   # should return a non-empty list
   ```

3. Check the app's sender number matches the account you linked:
   ```bash
   echo $SIGNAL_SENDER_NUMBER
   ```
   (The env var is set in fly.toml `[env]` section, not visible in logs.)

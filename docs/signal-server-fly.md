# Deploying Signal Server to Fly.io

This guide sets up [signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api)
on Fly.io — a persistent Docker container that Tokenping's Vercel cron calls to
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

```toml
app = "tokenping-signal"        # change to your preferred app name
primary_region = "iad"          # pick a region close to your Vercel deployment

[build]

[env]
  MODE = "json-rpc"             # recommended production mode for signal-cli-rest-api

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false    # keep alive — signal-cli needs a persistent process
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

### Option A — Link to your existing Signal account (recommended)

No extra phone number needed. signal-cli acts like Signal Desktop.

```bash
# Open a shell inside the running container
fly ssh console

# Inside the container — generate a link URI
signal-cli link -n "TokenpingBot"
```

This prints a `sgnl://linkdevice?...` URI and a QR code in the terminal.

**On your phone:** Signal → Settings → Linked Devices → tap **+** → scan the QR code.

You have about 2 minutes before the link expires. Once linked, exit the shell:

```bash
exit
```

### Option B — Register a dedicated phone number

Use a Twilio voice-capable long-code number (~$1/mo). Pure VoIP/SMS-only numbers
are often blocked by Signal; voice registration is more reliable.

```bash
fly ssh console

# Step 1 — get a CAPTCHA token
# Open this URL in a browser on the same network and copy the token from the URL bar:
# https://signalcaptchas.org/registration/generate.html

# Step 2 — register (replace +1XXXXXXXXXX with your Twilio number)
signal-cli -a +1XXXXXXXXXX register --voice --captcha <token>

# Step 3 — verify (Signal calls the number and reads a 6-digit code)
signal-cli -a +1XXXXXXXXXX verify <6-digit-code>

# Step 4 — set a registration lock PIN (protects against number hijacking)
signal-cli -a +1XXXXXXXXXX updateAccount --pin <choose-a-pin>

exit
```

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
# Send a test message to yourself — replace alice.42 with your Signal username
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

## 8. Keeping the server alive

Fly.io will keep the machine running because `auto_stop_machines = false` is set
in fly.toml. The signal-cli process in `json-rpc` mode stays resident and handles
requests without cold-start delays.

If you ever need to restart:

```bash
fly machine restart
```

To check logs:

```bash
fly logs
```

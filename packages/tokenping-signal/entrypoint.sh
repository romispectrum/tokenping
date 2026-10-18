#!/bin/bash
# Entrypoint of the Tokenping relay. It replaces the base image's s6-overlay /init, which refuses to start
# unless it is PID 1, and on Fly PID 1 is Fly's own init. signal-cli-rest-api has no auth of its own, so it
# runs behind Caddy (/etc/caddy/Caddyfile), which requires SIGNAL_API_TOKEN on every route but /v1/health.
set -euo pipefail

fail() {
  echo "tokenping-signal: $*" >&2
  exit 1
}

# The token is pasted into the Caddyfile, so it is limited to characters that cannot change its meaning
# there (no quotes, spaces, braces or the "*" wildcard of Caddy's header matcher).
[[ "${SIGNAL_API_TOKEN:-}" =~ ^[A-Za-z0-9._~+/=-]{32,}$ ]] ||
  fail "SIGNAL_API_TOKEN must be at least 32 characters of A-Z a-z 0-9 . _ ~ + / = - (try: openssl rand -hex 32)"

# json-rpc modes need the jsonrpc2-helper daemon that only the s6 setup starts.
case "${MODE:-normal}" in
  normal | native) ;;
  *) fail "MODE=$MODE is not supported by this image, use normal or native" ;;
esac

if [ "$(id -u)" = 0 ]; then
  # A new Fly volume is owned by root, and signal-cli run as root over `fly ssh console` leaves root-owned
  # files, so hand the data directory to signal-api on every start (as the 0.98 image's entrypoint did).
  chown -R signal-api:signal-api "$SIGNAL_CLI_CONFIG_DIR"
  export HOME=/home
  exec setpriv --reuid=signal-api --regid=signal-api --init-groups --inh-caps=-all "$0" "$@"
fi

env -u SIGNAL_API_TOKEN signal-cli-rest-api -signal-cli-config="$SIGNAL_CLI_CONFIG_DIR" &
api=$!
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
proxy=$!

trap 'kill -TERM "$api" "$proxy" 2>/dev/null' TERM INT

# When either process stops, stop the other and exit non-zero so Fly restarts the machine.
status=0
wait -n || status=$?
kill -TERM "$api" "$proxy" 2>/dev/null || true
wait || true
exit $((status == 0 ? 1 : status))

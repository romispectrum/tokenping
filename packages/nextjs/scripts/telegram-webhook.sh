#!/bin/bash
# Points the Telegram bot at the site's webhook, or shows where it points now.
#
#   yarn next:telegram-webhook          register https://tokenping.xyz/api/telegram/webhook, then show the result
#   yarn next:telegram-webhook info     only show the current webhook
#   yarn next:telegram-webhook set URL  register another webhook URL (an ngrok tunnel while developing)
#
# TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET come from the shell environment, else packages/nextjs/.env.local,
# else packages/nextjs/.env (the same order Next.js uses). The site URL comes from NEXT_PUBLIC_SITE_URL the same way,
# else https://tokenping.xyz. Neither secret is printed, and both reach curl on its standard input rather than its
# command line, so other processes can't read them from the process list. Written for the bash 3.2 macOS ships.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
DEFAULT_SITE_URL="https://tokenping.xyz"
WEBHOOK_PATH="/api/telegram/webhook"

fail() {
  echo "Error: $*" >&2
  exit 1
}

# The value of KEY in an env file, without printing it: the last assignment wins, an `export ` prefix, surrounding
# quotes, a trailing carriage return and an unquoted ` # comment` are dropped. Empty when the key is not there.
read_env_file() {
  local key="$1" file="$2" line value
  [ -f "$file" ] || return 0
  line="$(grep -E "^[[:space:]]*(export[[:space:]]+)?${key}=" "$file" | tail -n 1 || true)"
  [ -n "$line" ] || return 0
  value="${line#*=}"
  value="${value%$'\r'}"
  case "$value" in
    \"*\") value="${value#\"}"; value="${value%\"}" ;;
    \'*\') value="${value#\'}"; value="${value%\'}" ;;
    *) value="${value%% #*}" ;;
  esac
  # trailing whitespace
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

# KEY from the environment, else .env.local, else .env.
env_value() {
  local key="$1" value
  value="${!key:-}"
  [ -n "$value" ] || value="$(read_env_file "$key" "$APP_DIR/.env.local")"
  [ -n "$value" ] || value="$(read_env_file "$key" "$APP_DIR/.env")"
  printf '%s' "$value"
}

TOKEN="$(env_value TELEGRAM_BOT_TOKEN)"
SECRET="$(env_value TELEGRAM_WEBHOOK_SECRET)"
SITE_URL="$(env_value NEXT_PUBLIC_SITE_URL)"
SITE_URL="${SITE_URL:-$DEFAULT_SITE_URL}"

[ -n "$TOKEN" ] || fail "TELEGRAM_BOT_TOKEN is not set in the environment, $APP_DIR/.env.local or $APP_DIR/.env."
# BotFather's format. Checking it also means the token can't break out of the curl config below.
[[ "$TOKEN" =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]] || fail "TELEGRAM_BOT_TOKEN does not look like a BotFather token (digits:letters)."

# A value for a quoted curl config line: inside double quotes curl reads \\ and \" as escapes, so both are escaped.
config_quote() {
  local value="${1//\\/\\\\}"
  printf '"%s"' "${value//\"/\\\"}"
}

# The bot API URL holds the token, so it goes to curl in a config read from standard input (-K -), never as an
# argument. Prints the JSON response.
telegram() {
  local method="$1"
  shift
  {
    printf 'url = %s\n' "$(config_quote "https://api.telegram.org/bot$TOKEN/$method")"
    local field
    for field in "$@"; do printf 'data-urlencode = %s\n' "$(config_quote "$field")"; done
  } | curl --silent --show-error --max-time 30 --config -
}

# Pretty JSON when python3 is there, the raw response otherwise.
pretty() {
  if command -v python3 >/dev/null 2>&1; then python3 -m json.tool 2>/dev/null || cat; else cat; fi
}

show_info() {
  echo "Current webhook:"
  telegram getWebhookInfo | pretty
}

set_webhook() {
  local url="$1" response
  [ -n "$SECRET" ] || fail "TELEGRAM_WEBHOOK_SECRET is not set in the environment, $APP_DIR/.env.local or $APP_DIR/.env."
  # Telegram's rule for secret_token: 1 to 256 characters from A-Z, a-z, 0-9, _ and -. The length is checked on its
  # own: macOS's regex engine caps a repeat count at 255, so {1,256} would never match.
  [[ "$SECRET" =~ ^[A-Za-z0-9_-]+$ ]] && [ "${#SECRET}" -le 256 ] ||
    fail "TELEGRAM_WEBHOOK_SECRET may only use A-Z, a-z, 0-9, _ and - (1 to 256 characters)."
  [[ "$url" =~ ^https:// ]] || fail "The webhook URL must start with https:// (got $url)."

  echo "Registering $url"
  response="$(telegram setWebhook "url=$url" "secret_token=$SECRET" 'allowed_updates=["message"]' "drop_pending_updates=true")"
  echo "$response" | pretty
  case "$response" in
    *'"ok":true'*) echo ;;
    *) fail "Telegram refused the webhook (see the response above)." ;;
  esac
}

case "${1:-set}" in
  set)
    set_webhook "${2:-${SITE_URL%/}$WEBHOOK_PATH}"
    show_info
    ;;
  info)
    show_info
    ;;
  -h | --help | help)
    sed -n '2,7p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    ;;
  *)
    fail "Unknown command \"$1\". Use: set [URL], info or help."
    ;;
esac

# Pinned so a rebuild cannot change how the relay starts. 0.101 moved the image to s6-overlay, which does
# not run on Fly, so entrypoint.sh starts the processes itself.
FROM caddy:2.11.7 AS caddy

FROM bbernhard/signal-cli-rest-api:0.101

COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
COPY --chmod=755 entrypoint.sh /usr/local/bin/tokenping-entrypoint

# signal-cli-rest-api listens on PORT. Caddy takes the public 8080 and forwards to it.
ENV PORT=8081

# entrypoint.sh starts as root to chown the volume, then drops to signal-api.
USER root
ENTRYPOINT ["/usr/local/bin/tokenping-entrypoint"]

HEALTHCHECK --interval=20s --timeout=10s --retries=3 \
    CMD curl -fsS http://localhost:8080/v1/health || exit 1

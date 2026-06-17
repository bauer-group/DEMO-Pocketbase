# syntax=docker/dockerfile:1.6
# ----------------------------------------------------------------------------
# PocketBase – schlanke, reproduzierbare Image-Definition.
# Wir laden die offizielle Release-Binary von GitHub und packen sie in ein
# minimales Alpine-Image. So sind wir unabhängig von Drittanbieter-Images
# und können die Version exakt pinnen.
# ----------------------------------------------------------------------------

FROM alpine:3.24 AS downloader

ARG PB_VERSION=0.39.4
ARG TARGETARCH

RUN apk add --no-cache curl unzip ca-certificates \
 && case "${TARGETARCH}" in \
        amd64) PB_ARCH="amd64" ;; \
        arm64) PB_ARCH="arm64" ;; \
        *) echo "unsupported arch: ${TARGETARCH}" && exit 1 ;; \
    esac \
 && curl -fsSL -o /tmp/pb.zip \
    "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" \
 && unzip /tmp/pb.zip -d /pb \
 && chmod +x /pb/pocketbase

# ----------------------------------------------------------------------------

FROM alpine:3.24

RUN apk add --no-cache ca-certificates tzdata wget \
 && addgroup -S pb && adduser -S pb -G pb

COPY --from=downloader /pb/pocketbase /usr/local/bin/pocketbase

WORKDIR /pb
RUN mkdir -p /pb/pb_data /pb/pb_migrations /pb/pb_hooks \
 && chown -R pb:pb /pb

# Migrationen (Schema + Seed) und Hooks (Event-Hooks, Custom-Routes, Cron)
# werden beim Start automatisch geladen.
COPY --chown=pb:pb pb_migrations/ /pb/pb_migrations/
COPY --chown=pb:pb pb_hooks/ /pb/pb_hooks/

USER pb
EXPOSE 8090

# Healthcheck via internem Health-Endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8090/api/health || exit 1

ENTRYPOINT ["/usr/local/bin/pocketbase"]
CMD ["serve", \
     "--http=0.0.0.0:8090", \
     "--dir=/pb/pb_data", \
     "--migrationsDir=/pb/pb_migrations", \
     "--hooksDir=/pb/pb_hooks"]

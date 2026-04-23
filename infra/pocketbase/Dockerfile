# Per-tenant Pocketbase instance.
# One of these is deployed as a separate Fly app per tenant
# (app name: `mbg-pb-<tenant-id>`), in the FLY_TENANTS_ORG.

FROM alpine:3.19

ARG PB_VERSION=0.22.12

RUN apk add --no-cache ca-certificates unzip wget

# Install pocketbase binary.
RUN wget -q https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip \
    && mv pocketbase /usr/local/bin/pocketbase

# Fly mounts a persistent volume here; pocketbase stores its SQLite DB
# and uploaded files under /pb_data.
VOLUME /pb_data

EXPOSE 8080

# --http binds to 0.0.0.0 so Fly proxy can reach the instance.
CMD ["pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb_data"]

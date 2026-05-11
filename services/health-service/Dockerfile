# ─── Builder ──────────────────────────────────────────────────
FROM rust:1.77-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Cargo.toml ./

# Dependency cache layer: build fake binary with just the manifest
RUN mkdir -p src \
    && echo 'fn main() {}' > src/main.rs \
    && cargo build --release 2>/dev/null || true \
    && rm -rf src

# Build the real binary
COPY src ./src
RUN touch src/main.rs && cargo build --release

# ─── Runtime ──────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/health-service .

EXPOSE 8007

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD wget -q -O- http://localhost:8007/health || exit 1

CMD ["./health-service"]

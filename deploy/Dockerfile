# VibeSpec Pipeline — Multi-stage Docker build
# Runs the VibeSpec pipeline (all 5 phases) in a container.
# Deployment: Cloud Run Jobs or GKE

FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.json tsconfig.base.json ./

# Copy all packages
COPY packages/ ./packages/

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# ─── Production image ────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install Playwright system dependencies (for RL agent browser mode)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copy built packages
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/node_modules/ ./node_modules/

# Non-root user
RUN addgroup -g 1001 vibespec && adduser -u 1001 -G vibespec -s /bin/sh -D vibespec
USER vibespec

ENTRYPOINT ["node", "packages/cli/dist/cli.js"]
CMD ["run", "--help"]

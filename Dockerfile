# =============================================================================
# Matrix System — Multi-App Dockerfile for AWS Hosting
# Uses npm (matches monorepo tooling) and Next.js standalone output
# Build: docker build --build-arg APP_NAME=citadel --build-arg PORT=3005 -t matrix-citadel .
# =============================================================================

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

# --- STAGE 1: Dependencies ---
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/lib/ ./apps/lib/
COPY libs/ ./libs/

# Copy only the package.json of the target app (and all workspaces for hoisting)
COPY apps/citadel/package.json ./apps/citadel/package.json
COPY apps/reflect/package.json ./apps/reflect/package.json
COPY apps/nexus/package.json ./apps/nexus/package.json
COPY apps/ghost-command/package.json ./apps/ghost-command/package.json
COPY apps/rocket-command/package.json ./apps/rocket-command/package.json

RUN npm ci --no-audit --no-fund

# --- STAGE 2: Builder ---
FROM base AS builder
WORKDIR /app
ARG APP_NAME=citadel

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/ ./apps/
COPY --from=deps /app/libs/ ./libs/
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json

# Copy source code for target app and shared libs
COPY apps/${APP_NAME}/ ./apps/${APP_NAME}/
COPY apps/lib/ ./apps/lib/
COPY libs/ ./libs/
COPY tsconfig.json ./tsconfig.json
COPY turbo.json ./turbo.json

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN cd apps/${APP_NAME} && npx next build

# --- STAGE 3: Runner (minimal production image) ---
FROM node:22-alpine AS runner
WORKDIR /app

ARG APP_NAME=citadel
ARG PORT=3005

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=${PORT}
ENV HOSTNAME="0.0.0.0"
ENV MATRIX_CLOUD_MODE=true

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server and static assets
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public

USER nextjs

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

CMD ["node", "apps/${APP_NAME}/server.js"]

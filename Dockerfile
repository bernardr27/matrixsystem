# Multi-app Dockerfile for Matrix Monorepo
FROM node:20-alpine AS base

# Install pnpm and dependencies for build
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

# --- STAGE 1: Dependencies ---
FROM base AS deps
WORKDIR /app

# Copy lockfile and workspace config
COPY pnpm-lock.yaml* ./
COPY package.json ./

# Selective copy of app package.json files for better caching
# Note: This assumes a standard monorepo structure
# If using npm, replace pnpm commands accordingly
RUN pnpm install --frozen-lockfile

# --- STAGE 2: Builder ---
FROM base AS builder
WORKDIR /app
ARG APP_NAME=citadel
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the specific app
# Use Next.js standalone output for minimal image size
ENV NEXT_TELEMETRY_DISABLED 1
RUN cd apps/${APP_NAME} && pnpm run build

# --- STAGE 3: Runner ---
FROM base AS runner
WORKDIR /app

ARG APP_NAME=citadel
ARG PORT=3000

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone server
COPY --from=builder /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static

USER nextjs

EXPOSE ${PORT}
ENV PORT ${PORT}
ENV HOSTNAME "0.0.0.0"

# Command to run the specific application
CMD ["node", "server.js"]

# Dockerfile for NestJS API - Backend Only
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.13.1 --activate

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# Stage 2: Build the API
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/db ./packages/db
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api

ENV NODE_ENV=production

RUN pnpm turbo run build --filter=api...

# Stage 3: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only API dist and package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy minimal node_modules (only production dependencies)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder /app/packages/contracts/node_modules ./packages/contracts/node_modules

USER nextjs

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]

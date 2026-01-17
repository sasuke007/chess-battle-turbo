# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY apps/web-socket/package.json ./apps/web-socket/
COPY packages/typescript-config ./packages/typescript-config

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web-socket/node_modules ./apps/web-socket/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY apps/web-socket ./apps/web-socket

# Set working directory to websocket app
WORKDIR /app/apps/web-socket

# Build TypeScript (compile to JavaScript)
RUN npx tsc

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy root node_modules (for hoisted dependencies in monorepo)
COPY --from=deps /app/node_modules ./node_modules

# Copy app-specific node_modules
COPY --from=deps /app/apps/web-socket/node_modules ./apps/web-socket/node_modules

# Copy compiled code and package.json
COPY --from=builder /app/apps/web-socket/dist ./apps/web-socket/dist
COPY --from=builder /app/apps/web-socket/package.json ./apps/web-socket/package.json

# Set working directory to websocket app
WORKDIR /app/apps/web-socket

# Switch to non-root user
USER nodejs

EXPOSE 3002

ENV PORT=3002

# Start the application
CMD ["node", "dist/index.js"]


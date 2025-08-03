# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm ci && npm cache clean --force

# Development stage
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3001
ENV PORT 3001

CMD ["npm", "run", "dev", "--workspace=backend"]

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared
COPY .eslintrc.js ./
COPY package.json ./
COPY .prettierrc ./
COPY .prettierignore ./

# Generate Prisma client and build
RUN npm run build --workspace=shared
RUN npm run db:generate --workspace=backend
RUN npm run build --workspace=backend

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy built application
COPY --from=builder --chown=backend:nodejs /app/packages/backend/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/packages/backend/package*.json ./
COPY --from=builder --chown=backend:nodejs /app/packages/backend/prisma ./prisma
COPY --from=deps --chown=backend:nodejs /app/node_modules ./node_modules

USER backend

EXPOSE 3001
ENV PORT 3001

CMD ["npm", "start"]

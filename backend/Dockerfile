# Build from repo root: docker build -f backend/Dockerfile .
# Knowledge-base lives at repo root; copy script expects ../knowledge-base from backend.

FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend package files and install (including devDependencies for build)
COPY backend/package.json backend/package-lock.json backend/tsconfig.json backend/copy-knowledge-base.js ./
COPY backend/scripts ./scripts
COPY backend/src ./src

RUN npm ci

# Copy knowledge-base from repo root so copy-knowledge-base.js can find it
COPY knowledge-base ../knowledge-base

RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy built output (includes dist/knowledge-base from copy-knowledge-base.js)
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV NODEJS_HELPERS=0

EXPOSE 3000

CMD ["node", "dist/index.js"]

# Works with build context = backend/ (e.g. Render Root Directory = backend).
# Also works from repo root: docker build -f backend/Dockerfile backend

FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend files (no backend/ prefix when context is backend/)
COPY package.json package-lock.json tsconfig.json copy-knowledge-base.js ./
COPY scripts ./scripts
COPY src ./src
COPY knowledge-base ./knowledge-base

RUN npm ci && npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV NODEJS_HELPERS=0

EXPOSE 3000

CMD ["node", "dist/index.js"]

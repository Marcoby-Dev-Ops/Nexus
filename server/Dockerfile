######################################################################
# Server Dockerfile (multi-stage, production optimized)
#
# Stages:
# 1. deps   - install prod & dev deps (cached) using package-lock.json if present
# 2. prod-deps - prune to production-only deps
# 3. runtime - copy minimal node_modules + app source, run as non-root
#
# Usage:
#   docker build -t nexus-server ./server
# For development (with live reload) you may add a separate dev Dockerfile or
# mount source with nodemon outside the image.
######################################################################

ARG NODE_VERSION=20-slim

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
ENV NODE_ENV=development

# Copy lockfiles first for better layer caching (copy package-lock.json if it exists)
COPY package*.json ./

# Use npm ci for deterministic installs (falls back if lock missing)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Separate layer to prune dev dependencies for production
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
RUN npm prune --production

# Runtime image - minimal
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN useradd -m -r -s /sbin/nologin nodeusr \
  && chown -R nodeusr:nodeusr /app

# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy application source (only what is needed)
COPY . ./

# (Optional) If you had a build step for TS, you'd run it in a build stage and copy dist/ only.
# Current tsconfig has noEmit so we rely on JS runtime files only.

# Health dependencies (curl)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

USER nodeusr

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -fsS http://localhost:3001/health || exit 1

CMD ["node", "server.js"]

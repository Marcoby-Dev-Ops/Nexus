# Multi-stage build for React/Vite application
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root package files and workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json for all workspace packages
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Copy source code for the client application
COPY client/ ./client/
# Copy source code for the server application as well, for workspace context
COPY server/ ./server/

# Build stage
FROM base AS build
WORKDIR /app

# Build the client application
# We need to reference the filter from the WORKDIR
RUN pnpm --filter nexus-client... build

# Production stage
FROM nginx:alpine AS production

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy built assets from build stage
COPY --from=build /app/client/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY client/nginx.conf /etc/nginx/nginx.conf.template

# Create startup script for environment variable substitution
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'export BACKEND_URL=${VITE_API_URL:-https://napi.marcoby.com}' >> /docker-entrypoint.sh && \
    echo 'envsubst < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Start nginx with environment variable substitution
CMD ["/docker-entrypoint.sh"]

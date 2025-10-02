# Multi-stage build for React/Vite application
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN pnpm install

# Copy source code
COPY . .

# Build stage
FROM base AS build
WORKDIR /app

# Build the client application
RUN pnpm run build

# Production stage
FROM nginx:alpine AS production

# Install envsubst and curl/wget for environment variable substitution and health checks
# Coolify expects curl or wget to be available for HEALTHCHECK
RUN apk add --no-cache gettext curl wget

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the repo nginx config as template (keeps Dockerfile simpler and consistent with repo)
COPY nginx.conf /etc/nginx/nginx.conf.template

# Create startup script for environment variable substitution
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo 'export BACKEND_URL=${VITE_API_URL:-https://napi.marcoby.com}' >> /docker-entrypoint.sh && \
    echo 'echo "BACKEND_URL: $BACKEND_URL"' >> /docker-entrypoint.sh && \
    echo 'envsubst '"'"'$BACKEND_URL'"'"' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf' >> /docker-entrypoint.sh && \
    echo 'echo "Nginx configuration generated successfully"' >> /docker-entrypoint.sh && \
    echo 'nginx -t' >> /docker-entrypoint.sh && \
    echo 'echo "Nginx configuration test passed"' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Add health check (use curl for better compatibility with Coolify)
# Increased start-period to allow Nginx to fully start on slower hosts.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS --max-time 3 http://127.0.0.1/health || exit 1

# Start nginx with environment variable substitution
CMD ["/docker-entrypoint.sh"]

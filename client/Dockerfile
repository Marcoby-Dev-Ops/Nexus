# Multi-stage build for React/Vite application
# Use current LTS Node with a minimal Alpine base to reduce vulnerabilities
FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy source code
COPY . .

# Build stage
FROM base AS build
WORKDIR /app

# Build the client application
ARG VITE_API_URL
ARG VITE_AUTHENTIK_CLIENT_ID
ARG VITE_AUTHENTIK_URL
ARG VITE_ENABLE_STRICT_MODE
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_AUTHENTIK_CLIENT_ID=${VITE_AUTHENTIK_CLIENT_ID}
ENV VITE_AUTHENTIK_URL=${VITE_AUTHENTIK_URL}
ENV VITE_ENABLE_STRICT_MODE=${VITE_ENABLE_STRICT_MODE}
RUN pnpm run build

# Production stage
# Pin nginx version for security (update periodically)
FROM nginx:1.27-alpine AS production

# Install envsubst and curl/wget for environment variable substitution and health checks
# Coolify expects curl or wget to be available for HEALTHCHECK
RUN apk add --no-cache gettext curl wget

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the repo nginx config as template (keeps Dockerfile simpler and consistent with repo)
COPY nginx.conf /etc/nginx/nginx.conf.template

# Create startup script for environment variable substitution and runtime config
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    # Prepare backend URL used by nginx and the app
    echo 'export BACKEND_URL=${VITE_API_URL:-http://localhost:3001}' >> /docker-entrypoint.sh && \
    echo 'export BACKEND_PROXY_URL=${BACKEND_PROXY_URL:-http://nexus-server:3001}' >> /docker-entrypoint.sh && \
    echo 'echo "BACKEND_URL (frontend): $BACKEND_URL"' >> /docker-entrypoint.sh && \
    echo 'echo "BACKEND_PROXY_URL (nginx): $BACKEND_PROXY_URL"' >> /docker-entrypoint.sh && \
    # Generate nginx config from template
    echo 'envsubst '\''$BACKEND_PROXY_URL'\'' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf' >> /docker-entrypoint.sh && \
    echo 'echo "Nginx configuration generated successfully"' >> /docker-entrypoint.sh && \
    echo 'nginx -t' >> /docker-entrypoint.sh && \
    echo 'echo "Nginx configuration test passed"' >> /docker-entrypoint.sh && \
    # Generate runtime env-config.js for the frontend to read at runtime
    echo 'cat > /usr/share/nginx/html/env-config.js <<EOF' >> /docker-entrypoint.sh && \
    echo 'window.__APP_CONFIG__ = {' >> /docker-entrypoint.sh && \
    echo "  \"VITE_API_URL\": \"\${VITE_API_URL:-}\"," >> /docker-entrypoint.sh && \
    echo "  \"VITE_AUTHENTIK_CLIENT_ID\": \"\${VITE_AUTHENTIK_CLIENT_ID:-}\"," >> /docker-entrypoint.sh && \
    echo "  \"VITE_AUTHENTIK_URL\": \"\${VITE_AUTHENTIK_URL:-}\"," >> /docker-entrypoint.sh && \
    echo "  \"VITE_ENABLE_STRICT_MODE\": \"\${VITE_ENABLE_STRICT_MODE:-false}\"" >> /docker-entrypoint.sh && \
    echo '};' >> /docker-entrypoint.sh && \
    echo 'EOF' >> /docker-entrypoint.sh && \
    echo 'echo "env-config.js generated"' >> /docker-entrypoint.sh && \
    # Start nginx in foreground
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Add health check (use curl for better compatibility with Coolify)
# Increase start-period and timeout to allow the container to fully initialize on slower hosts.
# Print a diagnostic message when the check fails to make Coolify logs actionable.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD sh -c 'curl -fsS --max-time 8 http://127.0.0.1/health -w "HTTP %{http_code}\n" || (echo "[healthcheck] curl failed with code $?" >&2; exit 1)'

# Start nginx with environment variable substitution
CMD ["/docker-entrypoint.sh"]

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# BEGIN ENV CONFIG
# These build-args allow you to inject Supabase credentials (and any other
# public-facing Vite variables) at build-time, e.g.
# docker build --build-arg VITE_SUPABASE_URL=... \
#              --build-arg VITE_SUPABASE_ANON_KEY=... \
#              -t nexus-web .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Expose them to the build environment so Vite can substitute the values
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
# END ENV CONFIG

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.27.0-alpine AS production

# Labels for traceability
LABEL org.opencontainers.image.title="Nexus Web" \
      org.opencontainers.image.description="Nexus — AI-powered business OS (static SPA)" \
      org.opencontainers.image.version="${BUILD_VERSION:-latest}" \
      org.opencontainers.image.revision="${GIT_COMMIT:-local}" \
      org.opencontainers.image.created="${BUILD_DATE:-unknown}"

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx config for SPA
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \
    \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Fix permissions for Nginx cache directories
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Note: Running as root for now to avoid permission issues
# In production, you might want to use a more sophisticated setup

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 